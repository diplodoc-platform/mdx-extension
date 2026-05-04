import {visit} from 'unist-util-visit';
import type {Root} from 'mdast';
import type {Plugin} from 'unified';
import type {MdxJsxFlowElement, MdxJsxTextElement} from 'mdast-util-mdx-jsx';

interface RawTextOptions {
    tagNames?: string[];
}

export const remarkRawMdxContent: Plugin<[RawTextOptions?], Root> = (options = {}) => {
    const {tagNames = []} = options;

    return (tree, file) => {
        visit(tree, ['mdxJsxFlowElement', 'mdxJsxTextElement'], (mdxNode: unknown) => {
            const node = mdxNode as MdxJsxFlowElement | MdxJsxTextElement;
            if (node.name && tagNames.includes(node.name) && node.children?.length > 0) {
                const start = node.children[0].position?.start?.offset;
                const end = node.children[node.children.length - 1].position?.end?.offset;

                if (file?.value && typeof start === 'number' && typeof end === 'number') {
                    const rawContent = String(file.value).slice(start, end);

                    node.children = [
                        {
                            type: 'text',
                            value: rawContent,
                        },
                    ];
                }
            }
        });
    };
};
