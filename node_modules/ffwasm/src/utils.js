/*
    Copyright 2019 0KIMS association.

    This file is part of websnark (Web Assembly zkSnark Prover).

    websnark is a free software: you can redistribute it and/or modify it
    under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    websnark is distributed in the hope that it will be useful, but WITHOUT
    ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
    or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public
    License for more details.

    You should have received a copy of the GNU General Public License
    along with websnark. If not, see <https://www.gnu.org/licenses/>.
*/

const bigInt = require("big-integer");

exports.bigInt2BytesLE = function bigInt2BytesLE(_a, len) {
    const b = Array(len);
    let v = bigInt(_a);
    for (let i=0; i<len; i++) {
        b[i] = v.and(0xFF).toJSNumber();
        v = v.shiftRight(8);
    }
    return b;
};

exports.bigInt2U32LE = function bigInt2BytesLE(_a, len) {
    const b = Array(len);
    let v = bigInt(_a);
    for (let i=0; i<len; i++) {
        b[i] = v.and(0xFFFFFFFF).toJSNumber();
        v = v.shiftRight(32);
    }
    return b;
};

exports.isOcamNum = function(a) {
    if (!Array.isArray(a)) return false;
    if (a.length != 3) return false;
    if (typeof a[0] !== "number") return false;
    if (typeof a[1] !== "number") return false;
    if (!Array.isArray(a[2])) return false;
    return true;
};

const cache = {};

exports.bigInt2byteArray = function(prime, n, montgomery) {

    if (typeof cache[prime] == "undefined") {
        const n64 = Math.floor((prime.bitLength() - 1) / 64)+1;
        cache[prime] = {
            n64: n64,
            R: bigInt.one.shiftLeft(n64*64).mod(prime)
        };
    }


    if (n.lt(bigInt("80000000", 16)) ) {
        if (montgomery) {
            return addShortMontgomeryPositive(n);
        } else {
            return addShortPositive(n);
        }
    }
    if (n.geq(prime.minus(bigInt("80000000", 16))) ) {
        if (montgomery) {
            return addShortMontgomeryNegative(n);
        } else {
            return addShortNegative(n);
        }
    }
    if (montgomery) {
        return addLongMontgomery(n);
    } else {
        return addLongNormal(n);
    }

    function addShortPositive(a) {
        return [parseInt(a), 0, ...getLong(0)];
    }

    function addShortMontgomeryPositive(a) {
        return [parseInt(a), 0x40000000, ...getLong(toMontgomery(a)) ];
    }

    function addShortNegative(a) {
        const b = bigInt("80000000", 16 ).add(a.minus(  prime.minus(bigInt("80000000", 16 ))));
        return [parseInt(b), 0, ...getLong(0)];
    }

    function addShortMontgomeryNegative(a) {
        const b = bigInt("80000000", 16 ).add(a.minus(  prime.minus(bigInt("80000000", 16 ))));
        return [parseInt(b), 0x40000000, ...getLong(toMontgomery(a))];
    }

    function addLongNormal(a) {
        return [0, 0x80000000, ...getLong(a)];
    }


    function addLongMontgomery(a) {
        return [0, 0xC0000000, ...getLong(toMontgomery(a))];
    }

    function getLong(a) {
        const arr = [];
        let r = bigInt(a);
        while (!r.isZero()) {
            arr.push( parseInt(r.and(bigInt("FFFFFFFF", 16))));
            r = r.shiftRight(32);
        }
        while (arr.length<cache[prime].n64*2) arr.push(0);
        return arr;
    }

    function toMontgomery(a) {
        return a.times(cache[prime].R).mod(prime);
    }
};


