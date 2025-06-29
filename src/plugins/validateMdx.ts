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
                    throw new Error(`Value type ${node.key.type} is not allowed`);
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
                return;
            }

            if (node.type === 'Literal') {
                return;
            }

            throw new Error(`Value type ${node.type} is not allowed`);
        }

        function checkJsxProp(node: SpreadElement | Property) {
            if (node.type !== 'Property') {
                throw new Error(`Node type ${node.type} is not allowed`);
            }

            if (!['Literal', 'Identifier'].includes(node.key.type)) {
                throw new Error(`Node key type ${node.key.type} is not allowed`);
            }

            let name = '';
            if (node.key.type === 'Identifier') {
                name = node.key.name;
            }
            if (node.key.type === 'Literal') {
                name = String(node.key.value);
            }
            if (['dangerouslySetInnerHTML', 'ref'].includes(name) || /^on[A-Z]/.test(name)) {
                throw new Error(`Key name ${name} is not allowed`);
            }

            checkJsxPropValue(node.value);
            return;
        }

        function checkJsxCall(node: SimpleCallExpression): void | boolean {
            assert(node.arguments.length === 2, 'jsx arguments must be 2');

            const [component, componentParams] = node.arguments;

            assert(componentParams.type === 'ObjectExpression');
            componentParams.properties.forEach(checkJsxProp);

            if (
                component.type === 'Identifier' &&
                (['_Fragment', 'MDXLayout', '_createMdxContent'].includes(component.name) ||
                    componentSet.has(component.name))
            ) {
                return;
            }

            if (
                component.type === 'MemberExpression' &&
                component.object.type === 'Identifier' &&
                component.object.name === '_components' &&
                component.property.type === 'Identifier'
            ) {
                return;
            }

            if (component.type === 'Literal') {
                return;
            }

            throw new Error(`Component '${component.type}' is not allowed`);
        }

        function check(node: NodeType): void | boolean {
            if (!('type' in node)) return;

            switch (true) {
                case node.type === 'FunctionDeclaration': {
                    assert(
                        node.id.type === 'Identifier',
                        `FunctionDeclaration id.type ${node.id.type} is not allowed`,
                    );
                    if (['MDXContent'].includes(node.id.name)) {
                        return true;
                    }
                    if (['_missingMdxReference', '_createMdxContent'].includes(node.id.name)) {
                        return;
                    }
                    throw new Error(`FunctionDeclaration ${node.id.name} is not allowed`);
                }
                case node.type === 'VariableDeclarator': {
                    if (node.id.type === 'Identifier' && node.id.name === '_importMetaUrl') {
                        throw new Error(`Imports is not allowed`);
                    }

                    if (
                        node.id.type === 'Identifier' &&
                        ['MDXLayout', '_components'].includes(node.id.name)
                    ) {
                        return;
                    }

                    if (node.id.type === 'ObjectPattern') {
                        if (node.init?.type === 'Identifier' && node.init.name === '_components') {
                            return;
                        }
                        if (
                            node.init?.type === 'MemberExpression' &&
                            node.init.object.type === 'Identifier' &&
                            node.init.object.name === 'arguments' &&
                            node.init.property.type === 'Literal' &&
                            node.init.property.value === 0
                        ) {
                            return;
                        }

                        throw new Error(`Object pattern is not allowed`);
                    }

                    throw new Error(`VariableDeclarator type ${node.id.type} is not allowed`);
                }
                case node.type === 'MemberExpression': {
                    if (
                        node.object.type === 'Identifier' &&
                        node.object.name === 'arguments' &&
                        node.property.type === 'Literal' &&
                        node.property.value === 0
                    ) {
                        return;
                    }

                    if (
                        node.object.type === 'Identifier' &&
                        node.object.name === 'props' &&
                        node.property.type === 'Identifier' &&
                        node.property.name === 'components'
                    ) {
                        return;
                    }

                    if (
                        node.object.type === 'Identifier' &&
                        node.object.name === '_components' &&
                        node.property.type === 'Identifier'
                    ) {
                        return;
                    }

                    throw new Error(
                        `MemberExpression object.type ${node.object.type} is not allowed`,
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
                            const firstArg = node.arguments?.[0];
                            if (firstArg?.type === 'Literal') {
                                componentSet.add(String(firstArg.value));
                            }
                        }
                        return;
                    }

                    throw new Error(`Call '${node.callee.name}' is not allowed`);
                }
                case node.type === 'NewExpression': {
                    if (node.callee.type === 'Identifier' && node.callee.name === 'Error') {
                        return;
                    }
                    throw new Error(`Node type '${node.type}' is not allowed`);
                }
                case node.type === 'SpreadElement': {
                    if (
                        node.argument.type === 'MemberExpression' &&
                        node.argument.object.type === 'Identifier' &&
                        node.argument.object.name === 'props' &&
                        node.argument.property.type === 'Identifier' &&
                        node.argument.property.name === 'components'
                    ) {
                        return;
                    }

                    if (node.argument.type === 'Identifier' && node.argument.name === 'props') {
                        return;
                    }

                    throw new Error(`Node type '${node.type}' is not allowed`);
                }
                case node.type === 'AwaitExpression':
                case node.type === 'YieldExpression':
                case node.type === 'AssignmentExpression':
                case node.type === 'ImportExpression':
                case node.type === 'FunctionExpression':
                case node.type === 'LogicalExpression':
                case node.type === 'ArrowFunctionExpression': {
                    throw new Error(`Node type '${node.type}' is not allowed`);
                }
            }
        }

        if (check(node)) return;

        // Рекурсивный обход дочерних узлов
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
