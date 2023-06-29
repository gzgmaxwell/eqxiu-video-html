export function getRectPoint({ left: x, top: y, width, height, rotate }) {
    const { sqrt, pow, round, atan, PI } = Math;
    const r = sqrt(pow(width, 2) + pow(height, 2)) / 2;
    const a = round(atan(height / width) * 180 / PI);
    const tlbra = 180 - rotate - a;
    const trbla = a - rotate;
    const ta = 90 - rotate;
    const ra = rotate;

    const halfWidth = width / 2;
    const halfHeight = height / 2;

    const middleX = x + halfWidth;
    const middleY = y + halfHeight;

    const topLeft = {
        x: middleX + r * Math.cos(tlbra * Math.PI / 180),
        y: middleY - r * Math.sin(tlbra * Math.PI / 180),
    };
    const top = {
        x: middleX + halfHeight * Math.cos(ta * Math.PI / 180),
        y: middleY - halfHeight * Math.sin(ta * Math.PI / 180),
    };
    const topRight = {
        x: middleX + r * Math.cos(trbla * Math.PI / 180),
        y: middleY - r * Math.sin(trbla * Math.PI / 180),
    };
    const right = {
        x: middleX + halfWidth * Math.cos(ra * Math.PI / 180),
        y: middleY + halfWidth * Math.sin(ra * Math.PI / 180),
    };
    const bottomRight = {
        x: middleX - r * Math.cos(tlbra * Math.PI / 180),
        y: middleY + r * Math.sin(tlbra * Math.PI / 180),
    };
    const bottom = {
        x: middleX - halfHeight * Math.sin(ra * Math.PI / 180),
        y: middleY + halfHeight * Math.cos(ra * Math.PI / 180),
    };
    const bottomLeft = {
        x: middleX - r * Math.cos(trbla * Math.PI / 180),
        y: middleY + r * Math.sin(trbla * Math.PI / 180),
    };
    const left = {
        x: middleX - halfWidth * Math.cos(ra * Math.PI / 180),
        y: middleY - halfWidth * Math.sin(ra * Math.PI / 180),
    };
    const minX = Math.min(topLeft.x, topRight.x, bottomRight.x, bottomLeft.x);
    const maxX = Math.max(topLeft.x, topRight.x, bottomRight.x, bottomLeft.x);
    const minY = Math.min(topLeft.y, topRight.y, bottomRight.y, bottomLeft.y);
    const maxY = Math.max(topLeft.y, topRight.y, bottomRight.y, bottomLeft.y);
    return {
        point: {
            topLeft,
            top,
            topRight,
            right,
            bottomRight,
            bottom,
            bottomLeft,
            left,
        },
        width: maxX - minX,
        height: maxY - minY,
        left: minX,
        right: maxX,
        top: minY,
        bottom: maxY,
    };

}


export function getElementPropsformPoint({ rotate, topLeft: pTop, topRight, bottomLeft: pLeft, bottomRight }) {
    const { abs, sqrt, pow, atan, max, min, PI, sin, round } = Math;
    const centre = {
        x: (bottomRight.x - pTop.x) / 2,
        y: (bottomRight.y - topRight.y) / 2,
    };
    const dx = abs(pTop.x - centre.x);
    const dy = abs(pTop.y - centre.y);
    // 半对角线
    const r = sqrt(pow(dx, 2) + pow(dy, 2));
    console.log(r);
    const a = 180 - rotate - (atan(min(dy, dx) / max(dy, dx)) * 180 / PI);


    const halfHeight = abs(r * sin(a * PI / 180));
    const halfWidth = abs(r * sin((90 - a) * PI / 180));

    const height = halfHeight * 2;
    const width = halfWidth * 2;

    const left = centre.x - halfWidth;
    const top = centre.y - halfHeight;
    return {
        left,
        top,
        width,
        height,
    };
}


// window._checkefnc = function () {
//     function ck(rotate) {
//         const defaultELement = {
//             width: 300,
//             height: 30,
//             left: 0,
//             top: 0,
//             rotate: 0,
//         };
//         const realElem = {
//             ...defaultELement,
//             rotate,
//         };
//         const rect = getRectPoint(realElem);
//         const params = {
//             ...rect.point,
//             rotate: realElem.rotate,
//         };
//         const res = getElementPropsformPoint(params);
//         if (Object.keys(res)
//                 .some((key) => {
//                     const dif = Math.abs(~~(res[key]) - realElem[key]);
//                     if (dif > 50) {
//                         // console.log(~~(rotate / 90), key);
//                         return true;
//                     } else {
//                         // console.log('角度:', rotate, '属性', key, '值', dif);
//                         return false;
//                     }
//                 })) {
//             return res;
//         } else {
//             return true;
//         }
//     }
//
//     for (let rotate = 0; rotate <= 360; rotate += 1) {
//         const res = ck(rotate);
//         if (res !== true) {
//             // console.log('失败,角度', rotate, '数据:', res);
//         }
//     }
// };
