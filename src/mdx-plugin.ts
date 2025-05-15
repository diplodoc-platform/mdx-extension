import type { RuleBlock } from "markdown-it/lib/parser_block";
import type {
  MarkdownIt,
  MarkdownItPluginCb,
} from "@diplodoc/transform/lib/typings";
import type { RuleInline } from "markdown-it/lib/parser_inline";
import type { MdxArtifacts, MdxPluginEnv } from "./types";
import getRender from "./utils/getRender";
import type { RuleCore } from "markdown-it/lib/parser_core";
import type { Token } from "markdown-it";
import { findMatchingClosingTag } from "./utils/plugin";

interface Options {
  render?: (mdx: string, mdxArtifacts: MdxArtifacts) => string;
  isTestMode?: boolean;
}

type MdxBody = { content: string; fragment: string };

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
  const { render = getRender(), isTestMode = false } = options ?? {};

  const transform: MarkdownItPluginCb<MdxPluginEnv> = (md) => {
    const idMdxBody: Record<string, MdxBody> = {};

    const corePlugin: RuleCore = (state) => {
      let processedText = state.src;
      let index = 0;

      let pos = 0;
      while (pos < processedText.length) {
        // Находим следующую открывающую угловую скобку
        const openBracketPos = processedText.indexOf("<", pos);
        if (openBracketPos === -1) break;

        // Проверяем, что не достигли конца текста
        if (openBracketPos + 1 >= processedText.length) {
          pos = openBracketPos + 1;
          continue;
        }

        const nextChar = processedText[openBracketPos + 1];

        // Пропускаем закрывающие теги
        if (nextChar === "/") {
          pos = openBracketPos + 1;
          continue;
        }

        let openTag,
          openTagFragment,
          closeTag,
          closeTagFragment,
          openTagEnd,
          isSelfClosed = false,
          isMdx = false;

        if (nextChar === ">") {
          // Обработка <> тега
          openTag = "<>";
          openTagFragment = openTag;
          closeTag = "</>";
          closeTagFragment = closeTag;
          openTagEnd = openBracketPos + 2;
        } else if (/[A-Z]/.test(nextChar)) {
          // Обработка тегов с заглавной буквы (включая MDX)
          const tagMatch = processedText
            .slice(openBracketPos)
            .match(/<([A-Z][a-zA-Z0-9]*)([^>]*)>/);
          if (!tagMatch) {
            pos = openBracketPos + 1;
            continue;
          }

          const tagName = tagMatch[1];
          const tagAttrs = tagMatch[2] || "";

          // Проверяем, является ли тег self-closed
          isSelfClosed = tagAttrs.trim().endsWith("/");

          isMdx = tagName === "MDX";

          openTag = tagMatch[0];
          openTagFragment = `<${tagName}`;
          closeTag = `</${tagName}>`;
          closeTagFragment = `</${tagName}`;
          openTagEnd = openBracketPos + openTag.length;
        } else {
          // Это не интересующий нас тег, пропускаем
          pos = openBracketPos + 1;
          continue;
        }

        if (isSelfClosed) {
          // Сохраняем self-closed тег как содержимое
          const id = String(++index);
          idMdxBody[id] = { content: openTag, fragment: openTag };

          // Заменяем на placeholder
          const placeholder = `<MDX>${id}</MDX>`;
          processedText =
            processedText.slice(0, openBracketPos) +
            placeholder +
            processedText.slice(openTagEnd);

          pos = openBracketPos + placeholder.length;
          continue;
        }

        // Находим закрывающий тег
        const closeTagStart = findMatchingClosingTag(
          processedText,
          openTagEnd,
          openTagFragment,
          closeTagFragment,
        );
        if (closeTagStart === -1) {
          pos = openBracketPos + 1;
          continue;
        }

        const closeTagEnd = closeTagStart + closeTag.length;

        const fragment = processedText.slice(openBracketPos, closeTagEnd);
        // Извлекаем содержимое
        const content = isMdx
          ? processedText.slice(openTagEnd, closeTagStart)
          : fragment;
        const id = String(++index);
        idMdxBody[id] = { content, fragment };

        // Заменяем весь тег на placeholder
        const placeholder = `<MDX>${id}</MDX>`;
        processedText =
          processedText.slice(0, openBracketPos) +
          placeholder +
          processedText.slice(closeTagEnd);

        // Обновляем позицию для поиска
        pos = openBracketPos + placeholder.length;
      }

      // eslint-disable-next-line no-param-reassign
      state.src = processedText;
      return true;
    };

    md.core.ruler.before("block", "mdx-replacer-core", corePlugin);

    const mdxRe = /<MDX>(\d+)<\/MDX>/g;
    const tokenTypes = ["code_block", "code_inline", "fence"];
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

    md.core.ruler.push("mdx-replace-back", coreReplaceBack);

    const blockPlugin: RuleBlock = (state, startLine, endLine, silent) => {
      const { env } = state;
      if (env) {
        env.mdxArtifacts = env.mdxArtifacts || { idMdx: {} };
      }
      const { mdxArtifacts } = env;

      const start = state.bMarks[startLine] + state.tShift[startLine];

      if (state.src.slice(start, start + 5) !== "<MDX>") {
        return false;
      }

      let endPos = -1;
      let line = startLine;

      for (; line <= endLine; line++) {
        endPos = state.src.indexOf("</MDX>", state.bMarks[line]);
        if (endPos !== -1 && endPos <= state.eMarks[line]) {
          break;
        }
      }

      if (endPos === -1) return false;

      if (!silent) {
        const htmlToken = state.push("html_block", "", 0);
        const id = state.src.slice(start + 5, endPos);
        htmlToken.content = render(idMdxBody[id].content, mdxArtifacts);
        htmlToken.map = [startLine, line];

        const afterText = state.src.slice(endPos + 6, state.eMarks[line]);
        if (afterText) {
          const afterToken = state.push("inline", "", 0);
          afterToken.content = afterText;
          afterToken.children = [];
          afterToken.map = [line, line + 1];
        }
      }

      // eslint-disable-next-line no-param-reassign
      state.line = line + 1;

      return true;
    };

    md.block.ruler.before("table", "mdx-replacer-block", blockPlugin);

    const inlinePlugin: RuleInline = (state, silent) => {
      const { env } = state;
      if (env) {
        env.mdxArtifacts = env.mdxArtifacts || { idMdx: {} };
      }
      const { mdxArtifacts } = env;

      const start = state.pos;

      // Проверяем открывающий тег <MDX>
      if (state.src.slice(start, start + 5) !== "<MDX>") {
        return false;
      }

      // Находим закрывающий тег
      const endPos = state.src.indexOf("</MDX>", start + 5);
      if (endPos === -1) return false;

      if (!silent) {
        const token = state.push("html_inline", "", 0);
        const id = state.src.slice(start + 5, endPos);
        token.content = render(idMdxBody[id].content, mdxArtifacts);
      }

      // eslint-disable-next-line no-param-reassign
      state.pos = endPos + 6;
      return true;
    };

    md.inline.ruler.before("text", "mdx-replacer-inline", inlinePlugin);

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
