
#include <string>

    

class BinFile {
    BinFile(std::string fileName);
    ~BinFile();

    std::string type;
    char *addr;
    uint64_t size;
};
