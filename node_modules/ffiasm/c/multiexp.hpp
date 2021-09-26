#include "naf.hpp"
#include <memory.h>

namespace MultByScalar {

enum GEType {getZero, getBase, getGroup};

template <typename GroupElement, typename BaseGroupElement>
struct  Path {
    int nHeads;
    int *heads;
    GEType get;
    union {
        BaseGroupElement accBase;
        GroupElement acc;
    };

    int push(int h) {heads[nHeads] = h; return nHeads++;}
};

template <typename GroupElement, typename BaseGroupElement>
struct  State {
    int nBits;
    int nPaths;
    Path<GroupElement, BaseGroupElement> *paths;

    State<GroupElement, BaseGroupElement>(int aNBits) {
        nBits = aNBits;
        paths = new Path<GroupElement, BaseGroupElement>[nBits];
        for (int i=0; i<nBits; i++) {
            paths[i].heads = new int[nBits];
        }
        clean();
    }
    ~State<GroupElement, BaseGroupElement>() {
        for (int i=0; i<nBits; i++) {
            delete paths[i].heads;
        }
        delete paths;
    }
    int addPath() { 
        paths[nPaths].nHeads = 0;
        paths[nPaths].get = getZero;
        return nPaths++;
    };
    void clean() {
        nPaths = 0;
    }
};


// Implementation
template <typename BaseGroup, typename GroupElement, typename BasesGroupElement>
void nafMultiMulByScalar_processScalar(BaseGroup &G, GroupElement *accumulators, State<GroupElement, BasesGroupElement> &newState, State<GroupElement, BasesGroupElement>&oldState, BasesGroupElement& base, uint8_t* vals) 
{
    newState.clean();
    int newPaths[3];
    newPaths[0] = -1;  // Zero
    newPaths[1] = -1;  // One 
    newPaths[2] = -1;  // Neg one
    for (int i=0; i<oldState.nPaths; i++) {
        int contPaths[3];
        contPaths[0] = -1;  // Zero
        contPaths[1] = -1;  // One 
        contPaths[2] = -1;  // Neg one
        for (int j=0; j<oldState.paths[i].nHeads; j++) {
            int bit = oldState.paths[i].heads[j];
            int v = vals[bit];
            if (contPaths[v]<0) contPaths[v] = newState.addPath();
            newState.paths[contPaths[v]].push(bit);
        }
        for (int k=0; k<3; k++) {
            if (contPaths[k]<0) continue;
            if (newState.paths[contPaths[k]].nHeads == 1) {
                // Break the path and start a new one.
                int bit = newState.paths[contPaths[k]].heads[0];
                int v = vals[bit];
                switch (oldState.paths[i].get) {
                    case getZero: break;
                    case getBase: G.add(accumulators[bit], accumulators[bit], oldState.paths[i].accBase); break;
                    case getGroup: G.add(accumulators[bit], accumulators[bit], oldState.paths[i].acc); break;
                }
                if (newPaths[k]<0) {
                    newPaths[k] = contPaths[k];   // Use this path as the new path with this symbol
                    if (v==1) {
                        G.copy(newState.paths[contPaths[k]].accBase, base);
                        newState.paths[contPaths[k]].get=getBase;
                    } else if (v==2) {
                        G.neg(newState.paths[contPaths[k]].accBase, base);
                        newState.paths[contPaths[k]].get=getBase;
                    }
                } else {
                    newState.paths[newPaths[k]].push(bit);

                    if (contPaths[k] == newState.nPaths-1) {
                        // If it's the last, just delete the full path
                        newState.nPaths--;
                    } else {
                        // If not, set the number of elements to 0
                        newState.paths[contPaths[k]].nHeads = 0;
                    }
                }
            } else {
                // Contonue the path
                if (k==0) {
                    switch(oldState.paths[i].get) {
                        case getZero: 
                            newState.paths[contPaths[k]].get = getZero; 
                            break;
                        case getBase: 
                            G.copy( newState.paths[contPaths[k]].accBase, oldState.paths[i].accBase);
                            newState.paths[contPaths[k]].get = getBase; 
                            break;
                        case getGroup:
                            G.copy( newState.paths[contPaths[k]].acc, oldState.paths[i].acc);
                            newState.paths[contPaths[k]].get = getGroup; 
                            break;
                    }
                } else if (k==1) {
                    switch(oldState.paths[i].get) {
                        case getZero: 
                            G.copy(newState.paths[contPaths[k]].accBase, base);
                            newState.paths[contPaths[k]].get=getBase;
                            break;
                        case getBase: 
                            G.add(newState.paths[contPaths[k]].acc, oldState.paths[i].accBase, base);
                            newState.paths[contPaths[k]].get=getGroup;
                            break;
                        case getGroup:
                            G.add(newState.paths[contPaths[k]].acc, oldState.paths[i].acc, base);
                            newState.paths[contPaths[k]].get=getGroup;
                            break;
                    }
                } else if (k==2) {
                    switch(oldState.paths[i].get) {
                        case getZero: 
                            G.neg(newState.paths[contPaths[k]].accBase, base);
                            newState.paths[contPaths[k]].get=getBase;
                            break;
                        case getBase: 
                            G.sub(newState.paths[contPaths[k]].acc, oldState.paths[i].accBase, base);
                            newState.paths[contPaths[k]].get=getGroup;
                            break;
                        case getGroup:
                            G.sub(newState.paths[contPaths[k]].acc, oldState.paths[i].acc, base);
                            newState.paths[contPaths[k]].get=getGroup;
                            break;
                    }
                }
            }
        }
    }
}

template <typename BaseGroup, typename GroupElement, typename BasesGroupElement>
void nafMultiMulByScalar(BaseGroup &G, GroupElement& r, BasesGroupElement *bases, uint8_t* scalars, unsigned int scalarSize, int n)
{
    int nBits = scalarSize*8+2;
    GroupElement *accumulators;
    accumulators = new GroupElement[nBits];
    for (int i=0; i<nBits; i++) {
        G.copy(accumulators[i], G.zero());
    }
    State<GroupElement, BasesGroupElement> st[2] = {nBits, nBits};
    int firstPath = st[0].addPath();
    for (int i=0; i<nBits; i++) {
        st[0].paths[firstPath].push(i);
    }
    uint8_t *scalarZero = new uint8_t[scalarSize];
    memset (scalarZero, 0 , scalarSize);
    uint8_t *naf = new uint8_t[(scalarSize+2)*8];
    for (int i=0; i<n; i++) {
        if (G.isZero(bases[i])) continue;
        if (!memcmp(scalarZero, (const void *)(scalars + i*scalarSize), scalarSize)) continue;
        buildNaf(naf, scalars + i*scalarSize, scalarSize);

        nafMultiMulByScalar_processScalar<BaseGroup, GroupElement, BasesGroupElement>(G, accumulators, st[(i+1)%2], st[i%2], bases[i], naf);
    }

    // Add unfinished paths to accumulators
    for (int i=0; i<st[n%2].nPaths; i++) {
        if (st[n%2].paths[i].get != getZero) {
            for (int j=0; j<st[n%2].paths[i].nHeads; j++) {
                int bit = st[n%2].paths[i].heads[j];
                switch (st[n%2].paths[i].get) {
                    case getBase: 
                        G.add(accumulators[bit], accumulators[bit], st[n%2].paths[i].accBase);
                        break;
                    case getGroup:
                        G.add(accumulators[bit], accumulators[bit], st[n%2].paths[i].acc);
                        break;
                    case getZero: assert(false);
                } 
            }
        }
    }

    // Do the final add
    G.copy(r, G.zero());
    for (int i=nBits-1; i>=0; i--) {
        G.dbl(r,r);
        G.add(r, r, accumulators[i]);        
    }

    delete scalarZero;
    delete accumulators;
    delete naf;
}


} // Namespace