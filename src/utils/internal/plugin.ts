import type {MdxBody} from './types';

function findMatchingClosingTag(
    text: string,
    pos: number,
    openTagPart: string,
    closeTag: string,
    isFragmentElement: boolean,
) {
    let depth = 1;
    let currentPos = pos;

    while (depth > 0 && currentPos < text.length) {
        // Ищем следующий открывающий тег
        let nextOpenPos = text.indexOf(openTagPart, currentPos);
        if (!isFragmentElement) {
            while (
                nextOpenPos !== -1 &&
                /[a-zA-Z0-9]/.test(text[nextOpenPos + openTagPart.length])
            ) {
                nextOpenPos = text.indexOf(openTagPart, nextOpenPos + openTagPart.length);
            }
        }

        // Ищем следующий закрывающий тег
        const nextClosePos = text.indexOf(closeTag, currentPos);

        // Закрывающий тег не найден
        if (nextClosePos === -1) return -1;

        // Если нашли открывающий тег раньше закрывающего
        if (nextOpenPos !== -1 && nextOpenPos < nextClosePos) {
            depth++;
            // Пропускаем весь открывающий тег
            const endOfTag = text.indexOf('>', nextOpenPos) + 1;
            currentPos = endOfTag > 0 ? endOfTag : nextOpenPos + openTagPart.length;
        } else {
            depth--;
            if (depth === 0) {
                return nextClosePos;
            }
            currentPos = nextClosePos + closeTag.length;
        }
    }

    return -1;
}

interface ReplaceBlocksOptions {
    content: string;
    tagNameList?: string[];
    replacer: (body: MdxBody) => string;
}

export function replaceBlocks(options: ReplaceBlocksOptions) {
    const {tagNameList, replacer} = options;
    let processedText = options.content;

    let pos = 0;
    while (pos < processedText.length) {
        // Находим следующую открывающую угловую скобку
        const openBracketPos = processedText.indexOf('<', pos);
        if (openBracketPos === -1) break;

        // Проверяем, что не достигли конца текста
        if (openBracketPos + 1 >= processedText.length) {
            pos = openBracketPos + 1;
            continue;
        }

        const nextChar = processedText[openBracketPos + 1];

        // Пропускаем закрывающие теги
        if (nextChar === '/') {
            pos = openBracketPos + 1;
            continue;
        }

        let openTag,
            openTagFragment,
            closeTag,
            openTagEnd,
            tagName,
            isSelfClosed = false,
            isMdx = false,
            isFragment = false;

        if (nextChar === '>') {
            tagName = 'Fragment';
            // Обработка <> тега
            openTag = '<>';
            openTagFragment = openTag;
            closeTag = '</>';
            openTagEnd = openBracketPos + 2;
            isFragment = true;
        } else if (/[A-Z]/.test(nextChar)) {
            // Обработка тегов с заглавной буквы (включая MDX)
            const tagMatch = processedText
                .slice(openBracketPos)
                .match(/<([A-Z][a-zA-Z0-9]*)([^>]*)>/);
            if (!tagMatch) {
                pos = openBracketPos + 1;
                continue;
            }

            tagName = tagMatch[1];
            const tagAttrs = tagMatch[2] || '';

            // Проверяем, является ли тег self-closed
            isSelfClosed = tagAttrs.trim().endsWith('/');

            isMdx = tagName === 'MDX';

            openTag = tagMatch[0];
            openTagFragment = `<${tagName}`;
            closeTag = `</${tagName}>`;
            openTagEnd = openBracketPos + openTag.length;
        } else {
            // Это не интересующий нас тег, пропускаем
            pos = openBracketPos + 1;
            continue;
        }

        if (tagNameList && !tagNameList.includes(tagName)) {
            pos = openBracketPos + 1;
            continue;
        }

        if (isSelfClosed) {
            // Заменяем на placeholder
            const placeholder = replacer({content: openTag, fragment: openTag});
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
            closeTag,
            isFragment,
        );
        if (closeTagStart === -1) {
            pos = openBracketPos + 1;
            continue;
        }

        const closeTagEnd = closeTagStart + closeTag.length;

        const fragment = processedText.slice(openBracketPos, closeTagEnd);
        // Извлекаем содержимое
        const content = isMdx ? processedText.slice(openTagEnd, closeTagStart) : fragment;

        // Заменяем весь тег на placeholder
        const placeholder = replacer({content, fragment});
        processedText =
            processedText.slice(0, openBracketPos) + placeholder + processedText.slice(closeTagEnd);

        // Обновляем позицию для поиска
        pos = openBracketPos + placeholder.length;
    }
    return processedText;
}
