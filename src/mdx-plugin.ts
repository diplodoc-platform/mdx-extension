import type {RuleBlock} from 'markdown-it/lib/parser_block';
import type {MarkdownIt, MarkdownItPluginCb} from '@diplodoc/transform/lib/typings';
import type {RuleInline} from 'markdown-it/lib/parser_inline';
import type {MdxArtifacts, MdxPluginEnv} from './types';
import getRender from './utils/getRender';
import type {RuleCore} from 'markdown-it/lib/parser_core';
import type {Token} from 'markdown-it';
import {replaceBlocks} from './utils/internal/plugin';
import type {GetHtmlProps, MdxBody} from './utils/internal/types';
import {InternalTagName} from './constants';

interface Options {
    render?: (props: GetHtmlProps) => string;
    tagNames?: string[];
    isTestMode?: boolean;
}

export type MarkdownItWithTestEnv = MarkdownIt & {
    env: {
        idMdxBody: Record<string, MdxBody>;
        corePlugin: RuleCore;
        coreReplaceBack: RuleCore;
        blockPlugin: RuleBlock;
        inlinePlugin: RuleInline;
    };
};

const mdxPlugin = (options?: Options) => {
    const {render = getRender(), isTestMode = false, tagNames} = options ?? {};

    const transform: MarkdownItPluginCb<MdxPluginEnv> = (md) => {
        const idMdxBody: Record<string, MdxBody> = {};
        const iTagLen = InternalTagName.length + 2;

        const corePlugin: RuleCore = (state) => {
            let index = 0;

            // eslint-disable-next-line no-param-reassign
            state.src = replaceBlocks({
                content: state.src,
                tagNames,
                replacer: (body) => {
                    const id = String(++index);
                    idMdxBody[id] = body;
                    return `<${InternalTagName}>${id}</${InternalTagName}>`;
                },
            });

            return true;
        };

        md.core.ruler.before('block', 'mdx-replacer-core', corePlugin);

        const mdxRe = new RegExp(`<${InternalTagName}>(\\d+)</${InternalTagName}>`, 'g');
        const tokenTypes = ['code_block', 'code_inline', 'fence'];
        const coreReplaceBack: RuleCore = (state) => {
            const next = (tokens: Token[]) => {
                for (let i = 0, len = tokens.length; i < len; i++) {
                    const token = tokens[i];
                    if (tokenTypes.includes(token.type)) {
                        token.content = token.content.replace(mdxRe, (_, id) => {
                            return idMdxBody[id].fragment;
                        });
                    }
                    if (token.children) {
                        // eslint-disable-next-line callback-return
                        next(token.children);
                    }
                }
            };
            next(state.tokens);
            return true;
        };

        md.core.ruler.push('mdx-replace-back', coreReplaceBack);

        const blockPlugin: RuleBlock = (state, startLine, endLine, silent) => {
            const {env} = state as {env: {mdxArtifacts?: MdxArtifacts}};
            const mdxArtifacts = (env.mdxArtifacts = env.mdxArtifacts || {
                idMdx: {},
                idTagName: {},
            });

            const start = state.bMarks[startLine] + state.tShift[startLine];

            if (state.src.slice(start, start + iTagLen) !== `<${InternalTagName}>`) {
                return false;
            }

            let endPos = -1;
            let line = startLine;

            for (; line <= endLine; line++) {
                endPos = state.src.indexOf(`</${InternalTagName}>`, state.bMarks[line]);
                if (endPos !== -1 && endPos <= state.eMarks[line]) {
                    break;
                }
            }

            if (endPos === -1) return false;

            if (!silent) {
                const htmlToken = state.push('html_block', '', 0);
                const id = state.src.slice(start + iTagLen, endPos);
                const {content, tagName} = idMdxBody[id];
                htmlToken.content = render({mdx: content, mdxArtifacts, tagName});
                htmlToken.map = [startLine, line];

                const afterText = state.src.slice(endPos + (iTagLen + 1), state.eMarks[line]);
                if (afterText) {
                    const afterToken = state.push('inline', '', 0);
                    afterToken.content = afterText;
                    afterToken.children = [];
                    afterToken.map = [line, line + 1];
                }
            }

            // eslint-disable-next-line no-param-reassign
            state.line = line + 1;

            return true;
        };

        md.block.ruler.before('table', 'mdx-replacer-block', blockPlugin);

        const inlinePlugin: RuleInline = (state, silent) => {
            const {env} = state as {env: {mdxArtifacts?: MdxArtifacts}};
            const mdxArtifacts = (env.mdxArtifacts = env.mdxArtifacts || {
                idMdx: {},
                idTagName: {},
            });

            const start = state.pos;

            // Проверяем открывающий тег <MDX>
            if (state.src.slice(start, start + iTagLen) !== `<${InternalTagName}>`) {
                return false;
            }

            // Находим закрывающий тег
            const endPos = state.src.indexOf(`</${InternalTagName}>`, start + iTagLen);
            if (endPos === -1) return false;

            if (!silent) {
                const token = state.push('html_inline', '', 0);
                const id = state.src.slice(start + iTagLen, endPos);
                const {content, tagName} = idMdxBody[id];
                token.content = render({mdx: content, mdxArtifacts, tagName});
            }

            // eslint-disable-next-line no-param-reassign
            state.pos = endPos + (iTagLen + 1);
            return true;
        };

        md.inline.ruler.before('text', 'mdx-replacer-inline', inlinePlugin);

        if (isTestMode) {
            const testMd = md as MarkdownItWithTestEnv;
            testMd.env = testMd.env || {};
            testMd.env.idMdxBody = idMdxBody;
            testMd.env.corePlugin = corePlugin;
            testMd.env.coreReplaceBack = coreReplaceBack;
            testMd.env.blockPlugin = blockPlugin;
            testMd.env.inlinePlugin = inlinePlugin;
        }
    };

    return transform;
};

export default mdxPlugin;
