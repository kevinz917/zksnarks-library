const bigInt = require("big-integer");
const buildF1m = require("./build_f1m");
const buildUtils = require("./buildwasmff_utils");
const buildAdd = require("./buildwasmff_add");
const buildCmpOps = require("./buildwasmff_cmpops");
const buildMul = require("./buildwasmff_mul");
const buildDiv = require("./buildwasmff_div");
const buildPow = require("./buildwasmff_pow");
const buildBinOps = require("./buildwasmff_binops");
const buildLogicalOps = require("./buildwasmff_logicalops");
const utils = require("./utils");

module.exports = function buildWasmFf(module, prefix, prime, publish) {

    const ctx = {};
    ctx.module = module;
    ctx.prefix = prefix;
    ctx.prime = bigInt(prime);
    ctx.publish = publish;
    ctx.q = bigInt(ctx.prime);
    ctx.n64 = Math.floor((ctx.q.minus(1).bitLength() - 1)/64) +1;
    ctx.pTmp = module.alloc((ctx.n64 +1)*8);
    ctx.pTmp2 = module.alloc((ctx.n64 +1)*8);

    ctx.prefixI = prefix + "_int";
    ctx.prefixF = prefix + "_F1m";

    ctx.pNBits = module.alloc((ctx.n64 +1)*8);

    ctx.module.addData(ctx.pNBits, utils.bigInt2BytesLE(ctx.prime.bitLength(), 8));

    buildF1m(module, ctx.q, ctx.prefixF, ctx.prefixI);

    ctx.pR3 = module.modules[ctx.prefixF].pR3;
    ctx.pPrime = module.modules[ctx.prefixF].pq;
    ctx.binMask = bigInt.one.shiftLeft( ctx.prime.bitLength().mod(64) ).minus(1);

    buildUtils(ctx);
    buildAdd(ctx);
    buildCmpOps(ctx);
    buildMul(ctx);
    buildDiv(ctx);
    buildPow(ctx);
    buildBinOps(ctx);
    buildLogicalOps(ctx);

};
