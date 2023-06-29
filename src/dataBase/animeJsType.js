module.exports = {
    wobble: {
        keyframes: {
            "0%": { translateX: 0, translateY: 0, translateZ: 0, opacity: 1 },
            "15%": {
                translateX: "-25%",
                translateY: 0,
                translateZ: 0,
                rotateX: "-5deg",
                rotateY: "-5deg",
                rotateZ: "-5deg"
            },
            "30%": {
                translateX: "20%",
                translateY: 0,
                translateZ: 0,
                rotateX: "3deg",
                rotateY: "3deg",
                rotateZ: "3deg"
            },
            "45%": {
                translateX: "-15%",
                translateY: 0,
                translateZ: 0,
                rotateX: "-3deg",
                rotateY: "-3deg",
                rotateZ: "-3deg"
            },
            "60%": {
                translateX: "10%",
                translateY: 0,
                translateZ: 0,
                rotateX: "2deg",
                rotateY: "2deg",
                rotateZ: "2deg"
            },
            "75%": {
                translateX: "-5%",
                translateY: 0,
                translateZ: 0,
                rotateX: "-1deg",
                rotateY: "-1deg",
                rotateZ: "-1deg"
            },
            "100%": { translateX: 0, translateY: 0, translateZ: 0 }
        }
    },
    rubberBand: {
        keyframes: {
            "0%": { scaleX: 1, scaleY: 1, scaleZ: 1, opacity: 1 },
            "30%": { scaleX: 1.25, scaleY: 0.75, scaleZ: 1 },
            "40%": { scaleX: 0.75, scaleY: 1.25, scaleZ: 1 },
            "50%": { scaleX: 1.15, scaleY: 0.85, scaleZ: 1 },
            "65%": { scaleX: 0.95, scaleY: 1.05, scaleZ: 1 },
            "75%": { scaleX: 1.05, scaleY: 0.95, scaleZ: 1 },
            "100%": { scaleX: 1, scaleY: 1, scaleZ: 1 }
        }
    },
    rotate360: {
        keyframes: { "0%": { rotate: "0deg", opacity: 1 }, "100%": { rotate: "360deg" } }
    },
    flip: {
        keyframes: {
            "0%": {
                perspective: 400,
                opacity: 1,
                scaleX: 1,
                scaleY: 1,
                scaleZ: 1,
                transformOrigin: "50% 50%",
                translateZ: 50,
                rotateY: "-360deg",
                easing: "easeOutQuad"
            },

            "50%": {
                perspective: 400,
                scaleX: 2,
                scaleY: 2,
                scaleZ: 2,
                rotateY: "-170deg",
                translateZ: 50,
                easing: "easeInQuad"
            },

            "80%": {
                perspective: 400,
                scaleX: 0.95,
                scaleY: 0.95,
                scaleZ: 0.95,
                translateZ: 50,
                rotateY: "-50deg"
            },
            "100%": { scaleX: 1, scaleY: 1, scaleZ: 1, rotateY: 0, perspective: 0, translateZ: 0 }
        }
    },
    fanfare: {
        keyframes: {
            "0%": { scale: "1", opacity: 1 },
            "100%": { scale: "1", scale: "1", rotateZ: "0deg" },
            "30%": { scale: ".8", rotateZ: "5deg" },
            "40%": { scale: "1.15", rotateZ: "-5deg" },
            "60%": { scale: "1.15", rotateZ: "-5deg" },
            "80%": { scale: "1.15", rotateZ: "-5deg" },
            "50%": { scale: "1.15", rotateZ: "5deg" },
            "70%": { scale: "1.15", rotateZ: "5deg" },
            "90%": { scale: "1.15", rotateZ: "5deg" }
        }
    },
    fadeIn: { keyframes: { "0%": { opacity: "0" }, "100%": { opacity: 1 } } },
    slideInDown: {
        keyframes: {
            "0%": {
                translateX: 0,
                translateY: "-100%",
                translateZ: 0,
                visibility: "visible",
                opacity: 1
            },
            "100%": { translateX: 0, translateY: 0, translateZ: 0 }
        }
    },
    slideInUp: {
        keyframes: {
            "0%": {
                translateX: 0,
                translateY: "100%",
                translateZ: 0,
                visibility: "visible",
                opacity: 1
            },
            "100%": { translateX: 0, translateY: 0, translateZ: 0 }
        }
    },
    slideInRight: {
        keyframes: {
            "0%": {
                translateX: "-100%",
                translateY: 0,
                translateZ: 0,
                visibility: "visible",
                opacity: 1
            },
            "100%": { translateX: 0, translateY: 0, translateZ: 0 }
        }
    },
    slideInLeft: {
        keyframes: {
            "0%": {
                translateX: "100%",
                translateY: 0,
                translateZ: 0,
                visibility: "visible",
                opacity: 1
            },
            "100%": { translateX: 0, translateY: 0, translateZ: 0 }
        }
    },
    bounceInDown: {
        keyframes: {
            "0%": {
                easing: "cubicBezier(0.215,0.61,0.355,1)",
                opacity: "0",
                translateX: 0,
                translateY: "-100%",
                translateZ: 0
            },
            "60%": {
                easing: "cubicBezier(0.215,0.61,0.355,1)",
                opacity: 1,
                translateX: 0,
                translateY: "25%",
                translateZ: 0
            },
            "75%": {
                easing: "cubicBezier(0.215,0.61,0.355,1)",
                translateX: 0,
                translateY: "-10%",
                translateZ: 0
            },
            "90%": {
                easing: "cubicBezier(0.215,0.61,0.355,1)",
                translateX: 0,
                translateY: "5%",
                translateZ: 0
            },
            "100%": {
                easing: "cubicBezier(0.215,0.61,0.355,1)",
                translateX: 0,
                translateY: 0,
                translateZ: 0
            }
        }
    },
    bounceInUp: {
        keyframes: {
            "0%": {
                easing: "cubicBezier(0.215,0.61,0.355,1)",
                opacity: "0",
                translateX: 0,
                translateY: "100%",
                translateZ: 0
            },
            "60%": {
                easing: "cubicBezier(0.215,0.61,0.355,1)",
                opacity: 1,
                translateX: 0,
                translateY: "-20%",
                translateZ: 0
            },
            "75%": {
                easing: "cubicBezier(0.215,0.61,0.355,1)",
                translateX: 0,
                translateY: "10%",
                translateZ: 0
            },
            "90%": {
                easing: "cubicBezier(0.215,0.61,0.355,1)",
                translateX: 0,
                translateY: "-5%",
                translateZ: 0
            },
            "100%": {
                easing: "cubicBezier(0.215,0.61,0.355,1)",
                translateX: 0,
                translateY: 0,
                translateZ: 0
            }
        }
    },
    bounceInRight: {
        keyframes: {
            "0%": {
                easing: "cubicBezier(0.215,0.61,0.355,1)",
                opacity: "0",
                translateX: "-100%",
                translateY: 0,
                translateZ: 0
            },
            "60%": {
                easing: "cubicBezier(0.215,0.61,0.355,1)",
                opacity: 1,
                translateX: "25%",
                translateY: 0,
                translateZ: 0
            },
            "75%": {
                easing: "cubicBezier(0.215,0.61,0.355,1)",
                translateX: "-10%",
                translateY: 0,
                translateZ: 0
            },
            "90%": {
                easing: "cubicBezier(0.215,0.61,0.355,1)",
                translateX: "5%",
                translateY: 0,
                translateZ: 0
            },
            "100%": {
                easing: "cubicBezier(0.215,0.61,0.355,1)",
                translateX: 0,
                translateY: 0,
                translateZ: 0
            }
        }
    },
    bounceInLeft: {
        keyframes: {
            "0%": {
                easing: "cubicBezier(0.215,0.61,0.355,1)",
                opacity: "0",
                translateX: "100%",
                translateY: 0,
                translateZ: 0
            },
            "60%": {
                easing: "cubicBezier(0.215,0.61,0.355,1)",
                opacity: 1,
                translateX: "-25%",
                translateY: 0,
                translateZ: 0
            },
            "75%": {
                easing: "cubicBezier(0.215,0.61,0.355,1)",
                translateX: "10%",
                translateY: 0,
                translateZ: 0
            },
            "90%": {
                easing: "cubicBezier(0.215,0.61,0.355,1)",
                translateX: "-5%",
                translateY: 0,
                translateZ: 0
            },
            "100%": {
                easing: "cubicBezier(0.215,0.61,0.355,1)",
                translateX: 0,
                translateY: 0,
                translateZ: 0
            }
        }
    },
    flipInX: {
        keyframes: {
            "0%": {
                perspective: 400,
                rotateX: "90deg",
                opacity: 0.01,
                easing: "easeOutBounce"
            },
            "40%": {
                opacity: 0.8,
                perspective: 400,
                rotateX: "-20deg"
            },
            "60%": {
                rotateX: "10deg",
                opacity: 1
            },
            "80%": {
                opacity: 1,
                rotateX: "-5deg"
            },
            "100%": { opacity: 1, perspective: 0, rotateX: "0deg" }
        }
    },
    skewSlideOutDown: {
        keyframes: {
            "0%": { perspective: 1000, translateY: "-200%", skewX: "45deg" },
            "100%": { perspective: 0, skewX: "0deg", translateY: "0" }
        }
    },
    skewSlideOutUp: {
        keyframes: {
            "0%": { perspective: 1000, translateY: "200%", skewX: "45deg" },
            "100%": { perspective: 0, skewX: "0deg", translateY: "0%" }
        }
    },
    skewSlideOutRight: {
        keyframes: {
            "0%": { perspective: 1000, translateX: "-100%", skewX: "45deg" },
            // "40%": { skewX: "45deg", translateX: "-40%" },
            // "60%": { skewX: "30deg", translateX: "0%" },
            // "90%": { skewX: "20deg", translateX: "10%" },
            "100%": { perspective: 0, skewX: "0deg", translateX: "0%" }
        }
    },
    skewSlideOutLeft: {
        keyframes: {
            "0%": { perspective: 1000, translateX: "100%", skewX: "-45deg" },
            "100%": { perspective: 0, skewX: "0", translateX: "0" }
        }
    },
    scale: { keyframes: { "0%": { scale: "0" }, "100%": { scale: "1" } } },
    puffIn: {
        keyframes: {
            "0%": { scaleX: 2, scaleY: 2, scaleZ: 2 },
            "100%": { scaleX: 1, scaleY: 1, scaleZ: 1 }
        }
    },
    magnifier: {
        keyframes: {
            "0%": { scale: "0.5", "letter-spacing": "0", "white-space": "nowrap" },
            "100%": {
                scaleX: 1,
                scaleY: 1,
                scaleZ: 1,
                "letter-spacing": "30px",
                "white-space": "nowrap"
            }
        }
    },
    floatX: {
        keyframes: {
            "0%": { translateX: "0" },
            "100%": { translateX: "0" },
            "50%": { translateX: "20px" }
        }
    },
    hinge: {
        keyframes: {
            "0%": { transformOrigin: "0 0", easing: "easeInOutQuad" },
            "20%": {
                rotateZ: "80deg"
            },
            "60%": {
                rotateZ: "80deg"
            },
            "40%": {
                rotateZ: "60deg",
                opacity: 1
            },
            "80%": {
                rotateZ: "90deg",
                opacity: 1
            },
            "100%": { translateX: 0, translateY: "100%", translateZ: 0, opacity: 0, rotateY: 0 }
        }
    },
    holeOut: {
        keyframes: {
            "0%": { scaleX: 1, scaleY: 1, scaleZ: 1, rotateY: "0deg" },
            "100%": {
                opacity: "0",
                scaleX: 0,
                scaleY: 0,
                scaleZ: 0,
                rotateY: "180deg"
            }
        }
    },
    fadeBigOutRight: {
        keyframes: {
            "0%": {},
            "100%": { opacity: 0, translateX: "100%", translateY: 0, translateZ: 0 }
        }
    },
    fadeBigOutLeft: {
        keyframes: {
            "0%": {},
            "100%": {
                opacity: 0,
                translateX: "-100%",
                translateY: 0,
                translateZ: 0
            }
        }
    },
    fadeBigOutDown: {
        keyframes: {
            "0%": {},
            "100%": { opacity: "0", translateX: 0, translateY: "100%", translateZ: 0 }
        }
    },
    fadeBigOutUp: {
        keyframes: {
            "0%": {},
            "100%": {
                opacity: "0",
                translateX: 0,
                translateY: "-100%",
                translateZ: 0
            }
        }
    }
};
