import {visit} from 'unist-util-visit';
import type {Root} from 'mdast';
import type {Plugin} from 'unified';

interface RawTextOptions {
    tagNames?: string[];
}

export const remarkRawMdxContent: Plugin<[RawTextOptions?], Root> = (options = {}) => {
    const {tagNames = []} = options;

    return (tree, file) => {
        visit(tree, ['mdxJsxFlowElement', 'mdxJsxTextElement'], (node: any) => {
            if (tagNames.includes(node.name) && node.children?.length > 0) {
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