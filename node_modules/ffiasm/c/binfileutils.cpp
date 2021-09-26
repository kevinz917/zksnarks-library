#include <sys/mman.h>
#include <sys/stat.h>
#include <fcntl.h>
#include <unistd.h>
#include <system_error>


#include "binfileutils.hpp"

BinFile::BinFile(std::string fileName) {

    int fd;
    struct stat sb;

    fd = open(fileName.c_str(), O_RDONLY);
    if (fd == -1)
        throw std::system_error(errno, std::generic_category(), "open");
        

    if (fstat(fd, &sb) == -1)           /* To obtain file size */
        throw std::system_error(errno, std::generic_category(), "fstat");

    size = sb.st_size;
    addr = (char *)mmap(NULL, sb.st_size, PROT_READ, MAP_PRIVATE, fd, 0);
    close(fd);

    type.assign(addr, 4);



}

BinFile::~BinFile() {
    munmap(addr, size);
}
