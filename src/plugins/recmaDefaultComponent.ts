import type {Transformer} from 'unified';
import type {BaseNode, IfStatement, Program, ReturnStatement} from 'estree';

export interface Options {
    componentName?: string;
}

export const recmaDefaultComponent: (options?: Options) => Transformer<Program> = (
    options?: Options,
) => {
    const {componentName = 'DefaultComponent'} = options || {};

    const transformer: Transformer<Program> = (tree) => {
        function walk(node: BaseNode) {
            if (!node || typeof node !== 'object') return;

            if (node.type === 'IfStatement') {
                const ifNode = node as IfStatement;

                if (
                    ifNode.consequent &&
                    ifNode.consequent.type === 'ExpressionStatement' &&
                    ifNode.consequent.expression.type === 'CallExpression'
                ) {
                    const callNode = ifNode.consequent.expression;

                    if (
                        callNode.callee.type === 'Identifier' &&
                        callNode.callee.name === '_missingMdxReference' &&
                        callNode.arguments[0]?.type === 'Literal'
                    ) {
                        const replacementReturn: ReturnStatement = {
                            type: 'ReturnStatement',
                            argument: {
                                type: 'CallExpression',
                                optional: false,
                                callee: {
                                    type: 'Identifier',
                                    name: '_jsx',
                                },
                                arguments: [
                                    {
                                        type: 'MemberExpression',
                                        optional: false,
                                        computed: true,
                                        object: {
                                            type: 'MemberExpression',
                                            optional: false,
                                            computed: false,
                                            object: {type: 'Identifier', name: 'props'},
                                            property: {type: 'Identifier', name: 'components'},
                                        },
                                        property: {
                                            type: 'Literal',
                                            value: componentName,
                                        },
                                    },
                                    {
                                        type: 'ObjectExpression',
                                        properties: [
                                            {
                                                type: 'Property',
                                                kind: 'init',
                                                method: false,
                                                shorthand: false,
                                                computed: false,
                                                key: {type: 'Identifier', name: 'tagName'},
                                                value: callNode.arguments[0],
                                            },
                                        ],
                                    },
                                ],
                            },
                        };

                        ifNode.consequent = replacementReturn;
                        return;
                    }
                }
            }

            if (Array.isArray(node)) {
                for (const element of node) {
                    walk(element);
                }
            } else {
                for (const key in node) {
                    if (Object.prototype.hasOwnProperty.call(node, key)) {
                        walk(node[key as keyof typeof node] as unknown as BaseNode);
                    }
                }
            }
        }

        walk(tree);
    };

    return transformer;
};
