r = require;
W = r("../routes/wellKnown");
r("express")().use(W.basePath, W.router).listen(80, "0.0.0.0");
