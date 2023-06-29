import React from 'react';

function PlayButton({ onClick = null, className }) {


    return (
        <svg onClick={onClick} width="40px" height="40px" viewBox="0 0 40 40" version="1.1"
             xmlns="http://www.w3.org/2000/svg">
            <title>预览 [空格]</title>
            <desc>Created with Sketch.</desc>
            <g className={className} id="编辑器" stroke="none" strokeWidth="1" fill="none"
               fillRule="evenodd">
                <g id="图片-动态元素" transform="translate(-600.000000, -603.000000)" fill="#333"
                   fillRule="nonzero">
                    <g id="play-f" transform="translate(600.000000, 603.000000)">
                        <path
                            d="M18.5776503,27.6595621 C17.8411788,28.2233914 16.9205894,28.0354483 16.3682358,27.471619 C16.3682358,27.471619 16.3682358,27.471619 16.3682358,27.471619 C16,26.7198465 16,25.9680741 16,25.2163017 L16,15.4432603 C16,14.879431 16,14.3156017 16.3682358,13.7517724 C16.5523536,13.3758862 16.9205894,13.1879431 17.2888252,13 C17.6570609,13 18.2094146,13 18.3935324,13.1879431 L26.3106013,18.8262362 C27.0470728,19.3900655 27.2311907,20.329781 26.6788371,21.0815534 C26.4947192,21.2694965 26.4947192,21.2694965 26.3106013,21.4574397 L18.5776503,27.6595621 Z M20,0 C8.90909091,0 0,8.90909091 0,20 C0,31.0909091 8.90909091,40 20,40 C31.0909091,40 40,31.0909091 40,20 C40,8.90909091 31.0909091,0 20,0 Z"
                            id="Shape"></path>
                    </g>
                </g>
            </g>
        </svg>
    );
}


export default PlayButton;