/**
 * Функция для нахождения соответствующего закрывающего тега с учетом вложенности
 * @param text - исходный текст
 * @param pos - начальная позиция поиска
 * @param openTagPart - паттерн для поиска открывающего тега
 * @param closeTag - закрывающий тег
 * @param isFragmentElement - флаг, указывающий, что тег является фрагментом
 * @returns {number} - позиция закрывающего тега или -1, если не найден
 */
export function findMatchingClosingTag(
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
