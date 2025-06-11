/**
 * Функция для нахождения соответствующего закрывающего тега с учетом вложенности
 * @param text - исходный текст
 * @param pos - начальная позиция поиска
 * @param openTag - паттерн для поиска открывающего тега
 * @param closeTag - закрывающий тег
 * @param isFragment - флаг, указывающий, что тег является фрагментом
 * @returns {number} - позиция закрывающего тега или -1, если не найден
 */
export function findMatchingClosingTag(
    text: string,
    pos: number,
    openTag: string,
    closeTag: string,
    isFragment: boolean,
) {
    let depth = 1;
    let currentPos = pos;

    while (depth > 0 && currentPos < text.length) {
        // Ищем следующий открывающий тег
        let nextOpenPos = text.indexOf(openTag, currentPos);

        // Ищем следующий закрывающий тег
        let nextClosePos = text.indexOf(closeTag, currentPos);

        if (!isFragment) {
            while (nextOpenPos !== -1 && /[a-zA-Z0-9]/.test(text[nextOpenPos + openTag.length])) {
                nextOpenPos = text.indexOf(openTag, nextOpenPos + openTag.length);
            }
            while (nextClosePos !== -1 && !/[\s\t>]/.test(text[nextClosePos + closeTag.length])) {
                nextClosePos = text.indexOf(closeTag, nextClosePos + closeTag.length);
            }
        }

        // Закрывающий тег не найден
        if (nextClosePos === -1) return -1;

        // Если нашли открывающий тег раньше закрывающего
        if (nextOpenPos !== -1 && nextOpenPos < nextClosePos) {
            depth++;
            // Пропускаем весь открывающий тег
            const endOfTag = text.indexOf('>', nextOpenPos) + 1;
            currentPos = endOfTag > 0 ? endOfTag : nextOpenPos + openTag.length;
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
