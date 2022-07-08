import React from "react";

export default () => (
  <>
    <p>
      This string is for triggering streaming in Safari. Does that sound weird?
      Yes it does indeed.
    </p>
    <p>
      Safari needs enough contents to be displayed to enable streaming render. I
      don't know the exact behavior, but I found that it works in that way. I
      haven't measured the actual content size threshold of it, but I believe
      this will be enough.
    </p>
  </>
);
