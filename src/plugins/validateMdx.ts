import type {
    ArrayPattern,
    ArrowFunctionExpression,
    AssignmentExpression,
    AssignmentPattern,
    CallExpression,
    Comment,
    Directive,
    Expression,
    FunctionExpression,
    ImportExpression,
    MemberExpression,
    ModuleDeclaration,
    ObjectPattern,
    PrivateIdentifier,
    Program,
    Property,
    RestElement,
    SimpleCallExpression,
    SourceLocation,
    SpreadElement,
    Statement,
    VariableDeclarator,
} from 'estree';
import type {Transformer} from 'unified';

/* eslint-disable complexity */

function assert<T>(condition: T, message?: string): asserts condition {
    if (!condition) {
        throw new Error(message || 'Assertion failed');
    }
}

function hasAllProperties<T extends object, U extends object>(
    obj: T,
    properties: U,
): asserts obj is T & U {
    for (const [key, value] of Object.entries(properties)) {
        if (!(key in obj)) {
            throw new Error(`Missing property: ${key}`);
        }

        const objValue = obj[key as keyof T];

        if (typeof value === 'object' && value !== null) {
            if (Array.isArray(value)) {
                if (!Array.isArray(objValue)) {
                    throw new Error(`Property ${key} must be an array`);
                }
                if (value.length !== objValue.length) {
                    throw new Error(
                        `Array length mismatch for ${key}: expected ${value.length}, got ${objValue.length}`,
                    );
                }
                objValue.forEach((item, index) => {
                    hasAllProperties(item, value[index]);
                });
            } else {
                if (typeof objValue !== 'object' || objValue === null) {
                    throw new Error(`Property ${key} must be an object`);
                }
                hasAllProperties(objValue, value);
            }
        } else if (objValue !== value) {
            throw new Error(`Mismatched property value: ${key}`);
        }
    }
}

const isEqual = (...args: Parameters<typeof hasAllProperties>) => {
    try {
        hasAllProperties(...args);
        return true;
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_err) {
        // pass
    }
    return false;
};

type NodeType =
    | Program
    | Directive
    | Statement
    | ModuleDeclaration
    | VariableDeclarator
    | Property
    | CallExpression
    | Comment
    | SourceLocation
    | ArrowFunctionExpression
    | FunctionExpression
    | ImportExpression
    | MemberExpression
    | AssignmentExpression
    | SpreadElement
    | Expression
    | ObjectPattern
    | ArrayPattern
    | RestElement
    | AssignmentPattern
    | PrivateIdentifier;

const MAX_DEPTH = 50;

function validateAST(ast: Program): void {
    const componentSet = new Set<string>();
    const traverse = (node: NodeType, depth: number) => {
        if (depth > MAX_DEPTH) throw new Error('Max depth exceeded');

        if (!('type' in node)) return;

        function checkJsxPropValue(
            node:
                | RestElement
                | ArrayPattern
                | ObjectPattern
                | SpreadElement
                | Property
                | Expression
                | AssignmentPattern
                | PrivateIdentifier
                | null,
        ) {
            if (!node) return;

            if (node.type === 'Property') {
                if (!['Literal', 'Identifier'].includes(node.key.type)) {
                    throw new Error(`Component prop type '${node.key.type}' is not allowed`);
                }
                checkJsxPropValue(node.value);
                return;
            }

            if (node.type === 'ArrayExpression') {
                node.elements.forEach(checkJsxPropValue);
                return;
            }

            if (node.type === 'ObjectExpression') {
                node.properties.forEach(checkJsxPropValue);
                return;
            }

            if (node.type === 'BinaryExpression') {
                checkJsxPropValue(node.left);
                checkJsxPropValue(node.right);
                return;
            }

            if (
                node.type === 'CallExpression' &&
                node.callee.type === 'Identifier' &&
                ['_jsxs', '_jsx'].includes(node.callee.name)
            ) {
                // will be checked in traverse
                return;
            }

            if (node.type === 'Literal') {
                return;
            }

            throw new Error(`Component prop value type '${node.type}' is not allowed here`);
        }

        function checkJsxProp(
            node: SpreadElement | Property,
            component: SpreadElement | Expression,
        ) {
            const isSpreadProps = isEqual(node, {
                type: 'SpreadElement',
                argument: {
                    type: 'Identifier',
                    name: 'props',
                },
            });
            if (
                component.type === 'Identifier' &&
                ['MDXLayout', '_createMdxContent'].includes(component.name) &&
                isSpreadProps
            ) {
                return;
            }

            if (node.type !== 'Property') {
                throw new Error(`Component prop type '${node.type}' is not allowed`);
            }

            if (!['Literal', 'Identifier'].includes(node.key.type)) {
                throw new Error(`Component prop type '${node.key.type}' is not allowed`);
            }

            let name = '';
            if (node.key.type === 'Identifier') {
                name = node.key.name;
            }
            if (node.key.type === 'Literal') {
                name = String(node.key.value);
            }
            if (['dangerouslySetInnerHTML', 'ref'].includes(name) || /^on[A-Z]/.test(name)) {
                throw new Error(`Component prop '${name}' is not allowed`);
            }

            checkJsxPropValue(node.value);
            return;
        }

        function checkJsxCall(node: SimpleCallExpression): void | boolean {
            assert(node.arguments.length === 2, 'jsx arguments must be 2');

            const [component, componentParams] = node.arguments;

            assert(componentParams.type === 'ObjectExpression');
            componentParams.properties.forEach((prop) => checkJsxProp(prop, component));

            if (
                component.type === 'Identifier' &&
                (['_Fragment', 'MDXLayout', '_createMdxContent'].includes(component.name) ||
                    componentSet.has(component.name))
            ) {
                return;
            }

            const isComponentMatch = isEqual(component, {
                type: 'MemberExpression',
                object: {
                    type: 'Identifier',
                    name: '_components',
                },
                property: {
                    type: 'Identifier',
                },
                computed: false,
                optional: false,
            });
            if (isComponentMatch) {
                return;
            }

            if (component.type === 'Literal') {
                return;
            }

            throw new Error(`Component tag type '${component.type}' is not allowed here`);
        }

        function check(node: NodeType): void | boolean {
            if (!('type' in node)) return;

            switch (true) {
                case node.type === 'FunctionDeclaration': {
                    assert(
                        node.id.type === 'Identifier',
                        `${node.type}.id.type ${node.id.type} is not allowed`,
                    );

                    if (
                        ['MDXContent', '_missingMdxReference', '_createMdxContent'].includes(
                            node.id.name,
                        )
                    ) {
                        return;
                    }

                    throw new Error(`${node.type} is not allowed here`);
                }
                case node.type === 'VariableDeclarator': {
                    const isMetaUrlMatch = isEqual(node.id, {
                        type: 'Identifier',
                        name: '_importMetaUrl',
                    });
                    if (isMetaUrlMatch) {
                        assert(node.id.type === 'Identifier');
                        throw new Error(`${node.type}.id.name ${node.id.name} is not allowed`);
                    }

                    if (
                        node.id.type === 'Identifier' &&
                        ['MDXLayout', '_components'].includes(node.id.name)
                    ) {
                        return;
                    }

                    if (node.id.type === 'ObjectPattern') {
                        const isComponentsMatch = isEqual(node, {
                            init: {
                                type: 'Identifier',
                                name: '_components',
                            },
                        });
                        if (isComponentsMatch) {
                            return;
                        }

                        const isObjectPatternFromComponentsProps = isEqual(node, {
                            init: {
                                type: 'LogicalExpression',
                                operator: '||',
                                left: {
                                    type: 'MemberExpression',
                                    object: {
                                        type: 'Identifier',
                                        name: 'props',
                                    },
                                    property: {
                                        type: 'Identifier',
                                        name: 'components',
                                    },
                                    computed: false,
                                    optional: false,
                                },
                                right: {
                                    type: 'ObjectExpression',
                                    properties: [],
                                },
                            },
                        });
                        if (isObjectPatternFromComponentsProps) {
                            return;
                        }

                        const isFirstArgMatch = isEqual(node, {
                            init: {
                                type: 'MemberExpression',
                                object: {
                                    type: 'Identifier',
                                    name: 'arguments',
                                },
                                property: {
                                    type: 'Literal',
                                    value: 0,
                                },
                                computed: true,
                                optional: false,
                            },
                        });
                        if (isFirstArgMatch) {
                            return;
                        }

                        const isComponentsSpreadMatch = isEqual(node, {
                            id: {
                                type: 'ObjectPattern',
                                properties: [
                                    {
                                        type: 'Property',
                                        kind: 'init',
                                        key: {
                                            type: 'Identifier',
                                            name: 'wrapper',
                                        },
                                        value: {
                                            type: 'Identifier',
                                            name: 'MDXLayout',
                                        },
                                        method: false,
                                        shorthand: false,
                                        computed: false,
                                    },
                                ],
                            },
                            init: {
                                type: 'LogicalExpression',
                                operator: '||',
                                left: {
                                    type: 'MemberExpression',
                                    object: {
                                        type: 'Identifier',
                                        name: 'props',
                                    },
                                    property: {
                                        type: 'Identifier',
                                        name: 'components',
                                    },
                                    computed: false,
                                    optional: false,
                                },
                                right: {
                                    type: 'ObjectExpression',
                                    properties: [],
                                },
                            },
                        });
                        if (isComponentsSpreadMatch) {
                            return;
                        }

                        throw new Error(`${node.type}.id.type ${node.id.type} is not allowed here`);
                    }

                    throw new Error(`${node.type}.id.type ${node.id.type} is not allowed`);
                }
                case node.type === 'MemberExpression': {
                    const isFirstArgMatch = isEqual(node, {
                        object: {
                            type: 'Identifier',
                            name: 'arguments',
                        },
                        property: {
                            type: 'Literal',
                            value: 0,
                        },
                        computed: true,
                        optional: false,
                    });
                    if (isFirstArgMatch) {
                        return;
                    }

                    const isPropsComponentsMatch = isEqual(node, {
                        object: {
                            type: 'Identifier',
                            name: 'props',
                        },
                        property: {
                            type: 'Identifier',
                            name: 'components',
                        },
                        computed: false,
                        optional: false,
                    });
                    if (isPropsComponentsMatch) {
                        return;
                    }

                    const isComponentsMatch = isEqual(node, {
                        object: {
                            type: 'Identifier',
                            name: '_components',
                        },
                        property: {
                            type: 'Identifier',
                        },
                        computed: false,
                        optional: false,
                    });
                    if (isComponentsMatch) {
                        return;
                    }

                    throw new Error(
                        `${node.type}.object.type ${node.object.type} is not allowed here`,
                    );
                }
                case node.type === 'CallExpression': {
                    if (node.callee.type !== 'Identifier') {
                        throw new Error(`Call type '${node.callee.type}' is not allowed`);
                    }

                    if (['_jsxs', '_jsx'].includes(node.callee.name)) {
                        checkJsxCall(node);
                        return;
                    }

                    if (['_createMdxContent', '_missingMdxReference'].includes(node.callee.name)) {
                        if (node.callee.name === '_missingMdxReference') {
                            if (node.arguments.length) {
                                const [firstArg] = node.arguments;
                                if (firstArg.type === 'Literal') {
                                    componentSet.add(String(firstArg.value));
                                }
                            }
                        }
                        return;
                    }

                    throw new Error(`${node.type} is not allowed here`);
                }
                case node.type === 'NewExpression': {
                    const isErrorMatch = isEqual(node, {
                        type: 'NewExpression',
                        callee: {
                            type: 'Identifier',
                            name: 'Error',
                        },
                    });
                    if (isErrorMatch) {
                        return;
                    }

                    throw new Error(`${node.type} is not allowed here`);
                }
                case node.type === 'SpreadElement': {
                    const isPropsComponentsMatch = isEqual(node, {
                        type: 'SpreadElement',
                        argument: {
                            type: 'MemberExpression',
                            object: {
                                type: 'Identifier',
                                name: 'props',
                            },
                            property: {
                                type: 'Identifier',
                                name: 'components',
                            },
                            computed: false,
                            optional: false,
                        },
                    });
                    if (isPropsComponentsMatch) {
                        return;
                    }

                    const isPropsMatch = isEqual(node, {
                        type: 'SpreadElement',
                        argument: {
                            type: 'Identifier',
                            name: 'props',
                        },
                    });
                    if (isPropsMatch) {
                        return;
                    }

                    throw new Error(`${node.type} is not allowed here`);
                }
                case node.type === 'LogicalExpression': {
                    const isPropsComponentsMatch = isEqual(node, {
                        type: 'LogicalExpression',
                        operator: '||',
                        left: {
                            type: 'MemberExpression',
                            object: {
                                type: 'Identifier',
                                name: 'props',
                            },
                            property: {
                                type: 'Identifier',
                                name: 'components',
                            },
                            computed: false,
                            optional: false,
                        },
                        right: {
                            type: 'ObjectExpression',
                            properties: [],
                        },
                    });
                    if (isPropsComponentsMatch) {
                        return;
                    }

                    throw new Error(`${node.type} is not allowed here`);
                }
                case node.type === 'AwaitExpression':
                case node.type === 'YieldExpression':
                case node.type === 'AssignmentExpression':
                case node.type === 'ImportExpression':
                case node.type === 'FunctionExpression':
                case node.type === 'ArrowFunctionExpression': {
                    throw new Error(`${node.type} is not allowed`);
                }
            }
        }

        if (check(node)) return;

        for (const key in node) {
            if (key === 'type' || !Object.prototype.hasOwnProperty.call(node, key)) continue;

            const child = node[key as keyof typeof node];
            if (Array.isArray(child)) {
                child.forEach((item) => {
                    if (item && typeof item === 'object') traverse(item, depth + 1);
                });
            } else if (child && typeof child === 'object') {
                traverse(child, depth + 1);
            }
        }
    };

    traverse(ast, 0);
}

const transformer: Transformer<Program> = (ast) => {
    validateAST(ast);
};

export function validateMdx() {
    return transformer;
}
