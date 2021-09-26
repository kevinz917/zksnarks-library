

module.exports = function (ctx) {

    function buildRawFixedShl() {
        const f = ctx.module.addFunction(ctx.prefix+"_fixedShl");
        f.addParam("a", "i64");
        f.addParam("b", "i64");
        f.setReturnType("i64");

        const c = f.getCodeBuilder();
        f.addCode(
            // i64.shr_u  does not return 0 when shifted 64 pos we force here
            c.if(
                c.i64_ge_u(c.getLocal("b"), c.i64_const(64)),
                c.ret(c.i64_const(0))
            ),
            c.i64_shl(
                c.getLocal("a"),
                c.getLocal("b")
            )
        );
    }

    function buildRawFixedShr() {
        const f = ctx.module.addFunction(ctx.prefix+"_fixedShr");
        f.addParam("a", "i64");
        f.addParam("b", "i64");
        f.setReturnType("i64");

        const c = f.getCodeBuilder();
        f.addCode(
            // i64.shr_u  does not return 0 when shifted 64 pos we force here
            c.if(
                c.i64_ge_u(c.getLocal("b"), c.i64_const(64)),
                c.ret(c.i64_const(0))
            ),
            c.i64_shr_u(
                c.getLocal("a"),
                c.getLocal("b")
            )
        );
    }


    function buildRawGetChunck() {
        const f = ctx.module.addFunction(ctx.prefix+"_rawgetchunk");
        f.addParam("pA", "i32");
        f.addParam("i", "i32");
        f.setReturnType("i64");

        const c = f.getCodeBuilder();

        f.addCode(
            // i64.shr_u  does not return 0 when shifted 64 pos we force here
            c.if(
                c.i32_lt_u(c.getLocal("i"), c.i32_const(ctx.n64)),
                c.ret(
                    c.i64_load(
                        c.i32_add(
                            c.getLocal("pA"),
                            c.i32_mul(
                                c.getLocal("i"),
                                c.i32_const(8)
                            )
                        )
                    )
                )
            ),
            c.i64_const(0)
        );
    }

    function buildAdjustBinResult() {
        const f = ctx.module.addFunction(ctx.prefix+"_adjustBinResult");
        f.addParam("pA", "i32");

        const c = f.getCodeBuilder();

        f.addCode(
            c.i64_store(
                c.getLocal("pA"),
                ctx.n64*8,
                c.i64_and(
                    c.i64_load(
                        c.getLocal("pA"),
                        ctx.n64*8
                    ),
                    c.i64_const(ctx.binMask)
                )
            ),
            c.if(
                c.call(
                    ctx.prefixI + "_gte",
                    c.i32_add(c.getLocal("pA"), c.i32_const(8)),
                    c.i32_const(ctx.pPrime)
                ),
                c.drop(
                    c.call(
                        ctx.prefixI + "_sub",
                        c.i32_add(c.getLocal("pA"), c.i32_const(8)),
                        c.i32_const(ctx.pPrime),
                        c.i32_add(c.getLocal("pA"), c.i32_const(8))
                    )
                )
            )
        );
    }

    function buildRawShiftRightL() {
        const f = ctx.module.addFunction(ctx.prefix+"_rawshrl");
        f.addParam("pR", "i32");
        f.addParam("pA", "i32");
        f.addParam("n", "i32");
        f.addLocal("oWords1", "i32");
        f.addLocal("oBits1", "i64");
        f.addLocal("oWords2", "i32");
        f.addLocal("oBits2", "i64");
        f.addLocal("i", "i32");

        const c = f.getCodeBuilder();
        f.addCode(
            c.setLocal(
                "oWords1",
                c.i32_shr_u(
                    c.getLocal("n"),
                    c.i32_const(6)
                )
            ),
            c.setLocal(
                "oWords2",
                c.i32_add(
                    c.getLocal("oWords1"),
                    c.i32_const(1)
                )
            ),
            c.setLocal(
                "oBits1",
                c.i64_and(
                    c.i64_extend_i32_u(c.getLocal("n")),
                    c.i64_const(0x3F)
                )
            ),
            c.setLocal(
                "oBits2",
                c.i64_sub(
                    c.i64_const(64),
                    c.getLocal("oBits1")
                )
            ),
            c.setLocal(
                "i",
                c.i32_const(0)
            ),
            c.block(c.loop(
                c.br_if(1, c.i32_eq(c.getLocal("i"), c.i32_const(ctx.n64))),
                c.i64_store(
                    c.i32_add(
                        c.getLocal("pR"),
                        c.i32_mul(
                            c.getLocal("i"),
                            c.i32_const(8)
                        )
                    ),
                    c.i64_or(
                        c.call(
                            ctx.prefix + "_fixedShr",
                            c.call(
                                ctx.prefix + "_rawgetchunk",
                                c.getLocal("pA"),
                                c.i32_add(
                                    c.getLocal("oWords1"),
                                    c.getLocal("i")
                                )
                            ),
                            c.getLocal("oBits1")
                        ),
                        c.call(
                            ctx.prefix + "_fixedShl",
                            c.call(
                                ctx.prefix + "_rawgetchunk",
                                c.getLocal("pA"),
                                c.i32_add(
                                    c.getLocal("oWords2"),
                                    c.getLocal("i")
                                )
                            ),
                            c.getLocal("oBits2")
                        )
                    )
                ),
                c.setLocal(
                    "i",
                    c.i32_add(
                        c.getLocal("i"),
                        c.i32_const(1)
                    )
                ),
                c.br(0)
            ))
        );

    }



    function buildRawShiftLeftL() {
        const f = ctx.module.addFunction(ctx.prefix+"_rawshll");
        f.addParam("pR", "i32");
        f.addParam("pA", "i32");
        f.addParam("n", "i32");
        f.addLocal("oWords1", "i32");
        f.addLocal("oBits1", "i64");
        f.addLocal("oWords2", "i32");
        f.addLocal("oBits2", "i64");
        f.addLocal("i", "i32");

        const c = f.getCodeBuilder();
        f.addCode(
            c.setLocal(
                "oWords1",
                c.i32_sub(
                    c.i32_const(0),
                    c.i32_shr_u(
                        c.getLocal("n"),
                        c.i32_const(6)
                    )
                )
            ),
            c.setLocal(
                "oWords2",
                c.i32_sub(
                    c.getLocal("oWords1"),
                    c.i32_const(1)
                )
            ),
            c.setLocal(
                "oBits1",
                c.i64_and(
                    c.i64_extend_i32_u(c.getLocal("n")),
                    c.i64_const(0x3F)
                )
            ),
            c.setLocal(
                "oBits2",
                c.i64_sub(
                    c.i64_const(64),
                    c.getLocal("oBits1")
                )
            ),
            c.setLocal(
                "i",
                c.i32_const(0)
            ),
            c.block(c.loop(
                c.br_if(1, c.i32_eq(c.getLocal("i"), c.i32_const(ctx.n64))),
                c.i64_store(
                    c.i32_add(
                        c.getLocal("pR"),
                        c.i32_mul(
                            c.getLocal("i"),
                            c.i32_const(8)
                        )
                    ),
                    c.i64_or(
                        c.call(
                            ctx.prefix + "_fixedShl",
                            c.call(
                                ctx.prefix + "_rawgetchunk",
                                c.getLocal("pA"),
                                c.i32_add(
                                    c.getLocal("oWords1"),
                                    c.getLocal("i")
                                ),
                            ),
                            c.getLocal("oBits1")
                        ),
                        c.call(
                            ctx.prefix + "_fixedShr",
                            c.call(
                                ctx.prefix + "_rawgetchunk",
                                c.getLocal("pA"),
                                c.i32_add(
                                    c.getLocal("oWords2"),
                                    c.getLocal("i")
                                ),
                            ),
                            c.getLocal("oBits2")
                        )
                    )
                ),
                c.setLocal(
                    "i",
                    c.i32_add(
                        c.getLocal("i"),
                        c.i32_const(1)
                    )
                ),
                c.br(0)
            ))
        );
    }

    function buildRawShiftRight() {
        const f = ctx.module.addFunction(ctx.prefix+"_rawshr");
        f.addParam("pR", "i32");
        f.addParam("pA", "i32");
        f.addParam("n", "i32");

        const c = f.getCodeBuilder();
        f.addCode(
            ctx.ifLong(c, "pA",
                [
                    ...ctx.toNormal(c, "pA"),
                    ...c.call(
                        ctx.prefix + "_rawshrl",
                        c.i32_add(c.getLocal("pR"), c.i32_const(8)),
                        c.i32_add(c.getLocal("pA"), c.i32_const(8)),
                        c.getLocal("n"),
                    ),
                    ...ctx.setType(c, "pR", 0x80)
                ],[
                    ...ctx.ifNegative(c, "pA",
                        [
                            ...ctx.toLong(c, "pA"),
                            ...c.call(
                                ctx.prefix + "_rawshrl",
                                c.i32_add(c.getLocal("pR"), c.i32_const(8)),
                                c.i32_add(c.getLocal("pA"), c.i32_const(8)),
                                c.getLocal("n"),
                            ),
                            ...ctx.setType(c, "pR", 0x80)
                        ],
                        [
                            ...c.if(
                                c.i32_lt_u(
                                    c.getLocal("n"),
                                    c.i32_const(32)
                                ),
                                c.i32_store(
                                    c.getLocal("pR"),
                                    c.i32_shr_u(
                                        c.i32_load(c.getLocal("pA")),
                                        c.getLocal("n")
                                    )
                                ),
                                c.i32_store(
                                    c.getLocal("pR"),
                                    c.i32_const(0)
                                ),
                            ),
                            ...ctx.setType(c, "pR", 0)
                        ]
                    )
                ]
            )
        );
    }


    function buildRawShiftLeft() {
        const f = ctx.module.addFunction(ctx.prefix+"_rawshl");
        f.addParam("pR", "i32");
        f.addParam("pA", "i32");
        f.addParam("n", "i32");
        f.addLocal("r", "i64");
        f.addLocal("overflow", "i64");

        const c = f.getCodeBuilder();
        f.addCode(
            ctx.ifLong(c, "pA",
                [
                    ...ctx.toNormal(c, "pA"),
                    ...c.call(
                        ctx.prefix + "_rawshll",
                        c.i32_add(c.getLocal("pR"), c.i32_const(8)),
                        c.i32_add(c.getLocal("pA"), c.i32_const(8)),
                        c.getLocal("n"),
                    ),
                    ...c.call(
                        ctx.prefix + "_adjustBinResult",
                        c.getLocal("pR")
                    ),
                    ...ctx.setType(c, "pR", 0x80)
                ],[
                    ...ctx.ifNegative(c, "pA",
                        [

                            ...ctx.toLong(c, "pA"),
                            ...c.call(
                                ctx.prefix + "_rawshll",
                                c.i32_add(c.getLocal("pR"), c.i32_const(8)),
                                c.i32_add(c.getLocal("pA"), c.i32_const(8)),
                                c.getLocal("n"),
                            ),
                            ...c.call(
                                ctx.prefix + "_adjustBinResult",
                                c.getLocal("pR")
                            ),
                            ...ctx.setType(c, "pR", 0x80)
                        ],
                        [
                            ...c.if(
                                c.i32_gt_u(c.getLocal("n"), c.i32_const(30)),
                                [
                                    ...ctx.toLong(c, "pA"),
                                    ...c.call(
                                        ctx.prefix + "_rawshll",
                                        c.i32_add(c.getLocal("pR"), c.i32_const(8)),
                                        c.i32_add(c.getLocal("pA"), c.i32_const(8)),
                                        c.getLocal("n"),
                                    ),
                                    ...c.call(
                                        ctx.prefix + "_adjustBinResult",
                                        c.getLocal("pR")
                                    ),
                                    ...ctx.setType(c, "pR", 0x80)

                                ],[
                                    ...c.setLocal(
                                        "r",
                                        c.i64_shl(
                                            c.i64_load32_s(c.getLocal("pA")),
                                            c.i64_extend_i32_u(c.getLocal("n"))
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
                        ]
                    )
                ]
            )
        );
    }


    function buldShift(op) {
        const f = ctx.module.addFunction(ctx.prefix+"_" + op);
        f.addParam("pR", "i32");
        f.addParam("pA", "i32");
        f.addParam("pB", "i32");

        const oop = op == "shr" ? "shl" : "shr";

        const c = f.getCodeBuilder();

        f.addCode(
            ctx.ifNegative(c, "pB",
                [
                    ...c.call(
                        ctx.prefix + "_neg",
                        c.i32_const(ctx.pTmp2),
                        c.getLocal("pB"),
                    ),
                    ...c.call(
                        ctx.prefix + "_lt",
                        c.i32_const(ctx.pTmp),
                        c.i32_const(ctx.pTmp2),
                        c.i32_const(ctx.pNBits),
                    ),
                    ...c.if(
                        c.i32_load(c.i32_const(ctx.pTmp)),
                        [
                            ...c.call(
                                ctx.prefix + "_raw" + oop,
                                c.getLocal("pR"),
                                c.getLocal("pA"),
                                c.call(
                                    ctx.prefix + "_toInt",
                                    c.i32_const(ctx.pTmp2)
                                )
                            )
                        ],[
                            ...c.call(
                                ctx.prefixI + "_zero",
                                c.getLocal("pR")
                            )
                        ]
                    )
                ],[
                    ...c.call(
                        ctx.prefix + "_lt",
                        c.i32_const(ctx.pTmp),
                        c.getLocal("pB"),
                        c.i32_const(ctx.pNBits),
                    ),
                    ...c.if(
                        c.i32_load(c.i32_const(ctx.pTmp)),
                        [
                            ...c.call(
                                ctx.prefix + "_raw"+op,
                                c.getLocal("pR"),
                                c.getLocal("pA"),
                                c.call(
                                    ctx.prefix + "_toInt",
                                    c.getLocal("pB")
                                )
                            )
                        ],[
                            ...c.call(
                                ctx.prefixI + "_zero",
                                c.getLocal("pR")
                            )
                        ]
                    )
                ]
            )
        );
    }

    function buildRawBitOpL(op) {
        const f = ctx.module.addFunction(ctx.prefix+"_rawb" + op + "l");
        f.addParam("pA", "i32");
        f.addParam("pB", "i32");
        f.addParam("pR", "i32");

        const c = f.getCodeBuilder();

        for (let i=0; i<ctx.n64; i++) {
            f.addCode(
                c.i64_store(
                    c.getLocal("pR"),
                    i*8,
                    c["i64_"+op](
                        c.i64_load(
                            c.getLocal("pA"),
                            i*8
                        ),
                        c.i64_load(
                            c.getLocal("pB"),
                            i*8
                        )
                    )
                )
            );
        }
    }


    function buildBitOp(op) {
        buildRawBitOpL(op);
        const f = ctx.module.addFunction(ctx.prefix+"_b" + op);
        f.addParam("pR", "i32");
        f.addParam("pA", "i32");
        f.addParam("pB", "i32");

        const c = f.getCodeBuilder();

        f.addCode(
            ctx.ifLong(c, "pA",
                [
                    ...buildRawOp()
                ],[
                    ...ctx.ifNegative(c, "pA",
                        [
                            ...buildRawOp()
                        ],[
                            ...ctx.ifLong(c, "pB",
                                [
                                    ...buildRawOp()
                                ],[
                                    ...ctx.ifNegative(c, "pB",
                                        [
                                            ...buildRawOp()
                                        ],[
                                            ...c.i32_store(
                                                c.getLocal("pR"),
                                                c["i32_"+op](
                                                    c.i32_load(c.getLocal("pA")),
                                                    c.i32_load(c.getLocal("pB"))
                                                )
                                            ),
                                            ...ctx.setType(c, "pR", 0x00)
                                        ]
                                    )
                                ]
                            )
                        ]
                    )
                ]
            )
        );

        function buildRawOp() {
            return [
                ...ctx.toLong(c, "pA"),
                ...ctx.toNormal(c, "pA"),
                ...ctx.toLong(c, "pB"),
                ...ctx.toNormal(c, "pB"),
                ...c.call(
                    ctx.prefix+"_rawb"+op+"l",
                    c.i32_add(c.getLocal("pA"), c.i32_const(8)),
                    c.i32_add(c.getLocal("pB"), c.i32_const(8)),
                    c.i32_add(c.getLocal("pR"), c.i32_const(8))
                ),
                ...ctx.setType(c, "pR", 0x80),
                ...c.call(
                    ctx.prefix + "_adjustBinResult",
                    c.getLocal("pR")
                ),
            ];
        }
    }

    function buildRawBitNotL() {
        const f = ctx.module.addFunction(ctx.prefix+"_rawbnotl");
        f.addParam("pA", "i32");
        f.addParam("pR", "i32");

        const c = f.getCodeBuilder();

        for (let i=0; i<ctx.n64; i++) {
            f.addCode(
                c.i64_store(
                    c.getLocal("pR"),
                    i*8,
                    c.i64_xor(
                        c.i64_load(
                            c.getLocal("pA"),
                            i*8
                        ),
                        c.i64_const(-1)
                    )
                )
            );
        }
    }

    function buildBitNot() {
        buildRawBitNotL();
        const f = ctx.module.addFunction(ctx.prefix+"_bnot" );
        f.addParam("pR", "i32");
        f.addParam("pA", "i32");

        const c = f.getCodeBuilder();

        f.addCode(
            ctx.toLong(c, "pA"),
            ctx.toNormal(c, "pA"),
            c.call(
                ctx.prefix+"_rawbnotl",
                c.i32_add(c.getLocal("pA"), c.i32_const(8)),
                c.i32_add(c.getLocal("pR"), c.i32_const(8))
            ),
            ctx.setType(c, "pR", 0x80),
            c.call(
                ctx.prefix + "_adjustBinResult",
                c.getLocal("pR")
            )
        );
    }

    buildRawFixedShl();
    buildRawFixedShr();

    buildRawGetChunck();
    buildRawShiftLeftL();
    buildRawShiftRightL();
    buildAdjustBinResult();
    buildRawShiftLeft();
    buildRawShiftRight();

    buldShift("shl");
    buldShift("shr");

    buildBitOp("and");
    buildBitOp("or");
    buildBitOp("xor");
    buildBitNot();

    if (ctx.publish) {
        ctx.module.exportFunction(ctx.prefix + "_shr");
        ctx.module.exportFunction(ctx.prefix + "_shl");
        ctx.module.exportFunction(ctx.prefix + "_band");
        ctx.module.exportFunction(ctx.prefix + "_bor");
        ctx.module.exportFunction(ctx.prefix + "_bxor");
        ctx.module.exportFunction(ctx.prefix + "_bnot");
    }

};
