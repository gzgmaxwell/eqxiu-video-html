import { USER_MARKET_NAME, USER_MARKET_STYLE_LIST } from "../config/staticParams/userMarket";

export function getStylesList({ type }) {
    const list = USER_MARKET_STYLE_LIST[type];
    if (!list && !list.length) return [];
    const baseUrl = `/src/page/static/userMarketStyles/${USER_MARKET_NAME[type]}`;
    const resutl = list.map(({ prevKey, background, key }) => {
        const prevUrl = `import('${baseUrl}/${prevKey}')`;
        const backgroundUrl = `import('${baseUrl}/${background}')`;
        return { key, prevUrl, backgroundUrl };
    });
    return resutl;
}
