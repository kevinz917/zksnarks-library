#include "multiexp2.hpp"
namespace MultByScalar {


static const uint32_t tab32[32] = {
     0,  9,  1, 10, 13, 21,  2, 29,
    11, 14, 16, 18, 22, 25,  3, 30,
     8, 12, 20, 28, 15, 17, 24,  7,
    19, 27, 23,  6, 26,  5,  4, 31};

uint32_t log2 (uint32_t value)
{
    value |= value >> 1;
    value |= value >> 2;
    value |= value >> 4;
    value |= value >> 8;
    value |= value >> 16;
    return tab32[(uint32_t)(value*0x07C4ACDD) >> 27];
}


uint32_t getChunk(uint8_t* scalars, uint32_t scalarSize,uint32_t bitsPerChunk, uint32_t scalarIdx, uint32_t chunkIdx) {
    uint32_t res;
    uint32_t lsbIdx = (chunkIdx*bitsPerChunk)/32;
    if (lsbIdx*4 >= scalarSize) return 0;
    uint32_t shiftBits = (chunkIdx*bitsPerChunk)%32;
    if (shiftBits) {
        res = (  *(uint32_t *)(scalars + scalarIdx*scalarSize + lsbIdx*4) ) >> shiftBits;
        res |= (  *(uint32_t *)(scalars + scalarIdx*scalarSize + (lsbIdx + 1)*4) ) << (32 - shiftBits);
    } else {
        res = (  *(uint32_t *)(scalars + scalarIdx*scalarSize + lsbIdx) );
    }
    uint32_t maskBits = (lsbIdx*32 + shiftBits + bitsPerChunk > scalarSize*8) ? (scalarSize*8 - (lsbIdx*32 + shiftBits)) : bitsPerChunk;
    res = res & ((1 << maskBits) - 1);
    return res;
}

} // namespace;