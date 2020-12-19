#include <jsi/jsilib.h>
#include <jsi/jsi.h>

void installLeveldb(facebook::jsi::Runtime& jsiRuntime, std::string _documentDir);
void cleanupLeveldb();