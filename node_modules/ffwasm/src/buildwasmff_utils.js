const utils = require("./utils");
module.exports = function buildUtils(ctx) {

    ctx.ifLong = function(c, vL, t,e) {
        return [
            ...c.if(
                c.i32_and(
                    c.i32_load8_u(
                        c.getLocal(vL),
                        7
                    ),
                    c.i32_const(0x80)
                ),
                t,
                e
            )
        ];
    };


    ctx.ifMontgomery = function(c, vL, t,e) {
        return [
            ...c.if(
                c.i32_and(
                    c.i32_load8_u(
                        c.getLocal(vL),
                        7
                    ),
                    c.i32_const(0x40)
                ),
                t,
                e
            )
        ];
    };

    ctx.ifNegative = function(c, vL, t,e) {
        return [
            ...c.if(
                c.call(
                    ctx.prefix + "_isNegative",
                    c.getLocal(vL),
                ),
                t,
                e
            )
        ];
    };

    ctx.toMontgomery = function(c, l) {
        return c.call(
            ctx.prefix + "_toMontgomery",
            c.getLocal(l)
        );
    };

    ctx.toNormal = function(c, l) {
        return c.call(
            ctx.prefix + "_toNormal",
            c.getLocal(l)
        );
    };

    ctx.toLong = function(c, l) {
        return ctx.ifLong(c, l,
            [],
            [
                ...c.call(
                    ctx.prefix+"_rawCopyS2L",
                    c.i32_add(
                        c.getLocal(l),
                        c.i32_const(8)
                    ),
                    c.i64_load32_s(c.getLocal(l))
                ),
                ...ctx.setType(c, l, 0x80)
            ]
        );
    };

    ctx.setType = function(c, vL, t) {
        return c.i32_store(
            c.getLocal(vL),
            4,
            c.i32_const(t << 24)
        );
    };


    function buildCopy() {
        const f = ctx.module.addFunction(ctx.prefix+"_copy");
        f.addParam("pr", "i32");
        f.addParam("px", "i32");

        const c = f.getCodeBuilder();

        for (let i=0; i<=ctx.n64; i++) {
            f.addCode(
                c.i64_store(
                    c.getLocal("pr"),
                    i*8,
                    c.i64_load(
                        c.getLocal("px"),
                        i*8
                    )
                )
            );
        }
    }

    function buildCopyn() {
        const f = ctx.module.addFunction(ctx.prefix+"_copyn");
        f.addParam("pr", "i32");
        f.addParam("px", "i32");
        f.addParam("n", "i32");
        f.addLocal("s", "i32");
        f.addLocal("d", "i32");
        f.addLocal("slast", "i32");

        const c = f.getCodeBuilder();
        f.addCode(
            c.setLocal(
                "s",
                c.getLocal("px")
            ),
            c.setLocal(
                "d",
                c.getLocal("pr")
            ),
            c.setLocal(
                "slast",
                c.i32_add(
                    c.getLocal("s"),
                    c.i32_mul(
                        c.getLocal("n"),
                        c.i32_const((ctx.n64+1)*8)
                    )
                )
            ),
            c.block(c.loop(
                c.br_if(1, c.i32_eq(c.getLocal("s"), c.getLocal("slast"))),
                c.i64_store(
                    c.getLocal("d"),
                    c.i64_load(c.getLocal("s"))
                ),
                c.setLocal(
                    "d",
                    c.i32_add(
                        c.getLocal("d"),
                        c.i32_const(8)
                    )
                ),
                c.setLocal(
                    "s",
                    c.i32_add(
                        c.getLocal("s"),
                        c.i32_const(8)
                    )
                ),
                c.br(0)
            ))
        );
    }


    function buildIsTrue() {
        const f = ctx.module.addFunction(ctx.prefix+"_isTrue");
        f.addParam("px", "i32");
        f.setReturnType("i32");

        const c = f.getCodeBuilder();

        f.addCode(
            ctx.ifLong(c, "px",
                c.ret(
                    c.i32_eqz(
                        c.call(
                            ctx.prefixF + "_isZero",
                            c.i32_add(
                                c.getLocal("px"),
                                c.i32_const(8)
                            )
                        )
                    )
                )
            ),
            c.i32_ne(c.i32_load(c.getLocal("px")), c.i32_const(0))
        );
    }

    function buildRawCopyS2L() {
        const f = ctx.module.addFunction(ctx.prefix+"_rawCopyS2L");
        f.addParam("pR", "i32");
        f.addParam("v", "i64");

        const c = f.getCodeBuilder();

        f.addCode(
            c.if(
                c.i64_gt_s(
                    c.getLocal("v"), c.i64_const(0)
                ),
                [
                    ...copyShort(),
                ],[
                    ...c.setLocal("v", c.i64_sub(c.i64_const(0), c.getLocal("v"))),
                    ...copyShort(),
                    ...c.call(
                        ctx.prefixF + "_neg",
                        c.getLocal("pR"),
                        c.getLocal("pR")
                    )
                ]
            )
        );

        function copyShort() {
            const code = [];
            code.push(
                c.i64_store(
                    c.getLocal("pR"),
                    c.getLocal("v")
                )
            );
            for (let i=1; i<ctx.n64; i++) {
                code.push(
                    c.i64_store(
                        c.getLocal("pR"),
                        i*8,
                        c.i64_const(0)
                    )
                );
            }
            return [].concat(...code);
        }
    }

    function buildToMontgomery() {
        const f = ctx.module.addFunction(ctx.prefix+"_toMontgomery");
        f.addParam("pR", "i32");

        const c = f.getCodeBuilder();

        f.addCode(
            ctx.ifMontgomery(c, "pR",
                [  c.ret([]) ],
                [
                    ...ctx.ifLong(c, "pR",
                        [
                            ...ctx.setType(c, "pR", 0xC0),
                            ...c.call(
                                ctx.prefixF+"_toMontgomery",
                                c.i32_add(
                                    c.getLocal("pR"),
                                    c.i32_const(8)
                                ),
                                c.i32_add(
                                    c.getLocal("pR"),
                                    c.i32_const(8)
                                )
                            )
                        ],[
                            ...c.call(
                                ctx.prefix+"_rawCopyS2L",
                                c.i32_add(c.getLocal("pR"), c.i32_const(8)),
                                c.i64_load32_s(c.getLocal("pR"))
                            ),
                            ...c.call(
                                ctx.prefixF+"_toMontgomery",
                                c.i32_add(
                                    c.getLocal("pR"),
                                    c.i32_const(8)
                                ),
                                c.i32_add(
                                    c.getLocal("pR"),
                                    c.i32_const(8)
                                )
                            ),
                            ...ctx.setType(c, "pR", 0x40),
                        ])
                ]
            )
        );
    }


    function buildToNormal() {
        const f = ctx.module.addFunction(ctx.prefix+"_toNormal");
        f.addParam("pR", "i32");

        const c = f.getCodeBuilder();

        f.addCode(
            ctx.ifMontgomery(c, "pR",
                [
                    ...ctx.ifLong(c, "pR",
                        [
                            ...ctx.setType(c, "pR", 0x80),
                            ...c.call(
                                ctx.prefixF+"_fromMontgomery",
                                c.i32_add(
                                    c.getLocal("pR"),
                                    c.i32_const(8)
                                ),
                                c.i32_add(
                                    c.getLocal("pR"),
                                    c.i32_const(8)
                                )
                            )
                        ]
                    )
                ]
            )
        );
    }

    function buildToLongNormal() {
        const f = ctx.module.addFunction(ctx.prefix+"_toLongNormal");
        f.addParam("pR", "i32");

        const c = f.getCodeBuilder();

        f.addCode(
            ctx.ifLong(c, "pR",
                ctx.ifMontgomery(c, "pR",
                    [
                        ...ctx.setType(c, "pR", 0x80),
                        ...c.call(
                            ctx.prefixF+"_fromMontgomery",
                            c.i32_add(
                                c.getLocal("pR"),
                                c.i32_const(8)
                            ),
                            c.i32_add(
                                c.getLocal("pR"),
                                c.i32_const(8)
                            )
                        )
                    ]
                ),
                [
                    ...c.call(
                        ctx.prefix+"_rawCopyS2L",
                        c.i32_add(
                            c.getLocal("pR"),
                            c.i32_const(8)
                        ),
                        c.i64_load32_s(c.getLocal("pR"))
                    ),
                    ...ctx.setType(c, "pR", 0x80)
                ]
            )
        );
    }

    function buildGetLsb32() {
        const f = ctx.module.addFunction(ctx.prefix+"_getLsb32");
        f.addParam("pA", "i32");
        f.setReturnType("i32");

        const c = f.getCodeBuilder();

        f.addCode(
            ctx.ifLong(c, "pA",
                [
                    ...ctx.toNormal(c, "pA"),
                    ...c.ret(
                        c.i32_load(
                            c.getLocal("pA"),
                            8
                        )
                    )
                ],[
                    ...c.ret(
                        c.i32_load(
                            c.getLocal("pA")
                        )
                    )
                ]
            ),
            c.i32_const(0)
        );
    }


    function buildToInt() {
        buildGetLsb32();
        const f = ctx.module.addFunction(ctx.prefix+"_toInt");
        f.addParam("pA", "i32");
        f.setReturnType("i32");

        const c = f.getCodeBuilder();

        f.addCode(
            c.if(
                c.call(
                    ctx.prefix + "_isNegative",
                    c.getLocal("pA")
                ),
                [
                    ...c.call(
                        ctx.prefix + "_neg",
                        c.i32_const(ctx.pTmp),
                        c.getLocal("pA")
                    ),
                    ...c.ret(
                        c.i32_sub(
                            c.i32_const(0),
                            c.call(
                                ctx.prefix + "_getLsb32",
                                c.i32_const(ctx.pTmp)
                            )
                        )
                    )
                ],[
                    ...c.ret(
                        c.call(
                            ctx.prefix + "_getLsb32",
                            c.getLocal("pA")
                        )
                    )
                ]
            ),
            c.i32_const(0)
        );

    }

    const pdiv2 = ctx.module.alloc(utils.bigInt2BytesLE(ctx.prime.shiftRight(1), ctx.n64*8));

    function buildIsNegative() {
        const f = ctx.module.addFunction(ctx.prefix+"_isNegative");
        f.addParam("pA", "i32");
        f.setReturnType("i32");

        const c = f.getCodeBuilder();

        f.addCode(
            ctx.ifLong(c, "pA",
                [
                    ...ctx.toNormal(c, "pA"),
                    ...c.ret(
                        c.call(
                            ctx.prefixI + "_gt",
                            c.i32_add(
                                c.getLocal("pA"),
                                c.i32_const(8)
                            ),
                            c.i32_const(pdiv2)
                        )
                    )
                ]
            ),
            c.i32_lt_s(
                c.i32_load(c.getLocal("pA")),
                c.i32_const(0)
            )
        );
    }

    function buildNeg() {
        const f = ctx.module.addFunction(ctx.prefix+"_neg");
        f.addParam("pR", "i32");
        f.addParam("pA", "i32");
        f.addLocal("r", "i64");
        f.addLocal("overflow", "i64");

        const c = f.getCodeBuilder();

        f.addCode(
            ctx.ifLong(c, "pA",
                [  // l1
                    ...ctx.ifMontgomery(c, "pA",
                        ctx.setType(c, "pR", 0xC0),
                        ctx.setType(c, "pR", 0x80)
                    ),
                    ...c.call(
                        ctx.prefixF + "_neg",
                        c.i32_add(c.getLocal("pA"), c.i32_const(8)),
                        c.i32_add(c.getLocal("pR"), c.i32_const(8))
                    )
                ],[  // s1
                    ...c.setLocal(
                        "r",
                        c.i64_sub(
                            c.i64_const(0),
                            c.i64_load32_s(
                                c.getLocal("pA")
                            )
                        )
                    ),
                    ...c.setLocal(
                        "overflow",
                        c.i64_shr_s(
                            c.getLocal("r"),
                            c.i64_const(31)
                        )
                    ),
                    ...c.if(
                        c.i32_or(
                            c.i64_eqz(c.getLocal("overflow")),
                            c.i64_eqz(c.i64_add(
                                c.getLocal("overflow"),
                                c.i64_const(1)
                            ))
                        ),
                        [
                            ...c.i64_store32(
                                c.getLocal("pR"),
                                c.getLocal("r")
                            ),
                            ...c.i32_store(
                                c.getLocal("pR"),
                                4,
                                c.i32_const(0)
                            )
                        ],[ // Fix overflow
                            ...ctx.setType(c, "pR", 0x80),
                            ...c.call(
                                ctx.prefix + "_rawCopyS2L",
                                c.i32_add(c.getLocal("pR"), c.i32_const(8)),
                                c.getLocal("r")
                            )

                        ]
                    )
                ]
            )
        );
    }


    buildCopy();
    buildCopyn();
    buildIsTrue();
    buildRawCopyS2L();
    buildToMontgomery();
    buildToNormal();
    buildToLongNormal();
    buildIsNegative();
    buildNeg();
    buildToInt();

    if (ctx.publish) {
        ctx.module.exportFunction(ctx.prefix + "_copy");
        ctx.module.exportFunction(ctx.prefix + "_copyn");
        ctx.module.exportFunction(ctx.prefix + "_isTrue");
        ctx.module.exportFunction(ctx.prefix + "_toMontgomery");
        ctx.module.exportFunction(ctx.prefix + "_toNormal");
        ctx.module.exportFunction(ctx.prefix + "_toLongNormal");
        ctx.module.exportFunction(ctx.prefix + "_neg");
        ctx.module.exportFunction(ctx.prefix + "_toInt");
    }

};
