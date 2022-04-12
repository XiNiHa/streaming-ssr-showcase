import React from "react";
import NonStreamedNestedDataApp from "./routes/NonStreamedNestedData";
import init from "./clientInit";

// This example uses global cache
init(() => <NonStreamedNestedDataApp cache={window.globalCache!} />)
