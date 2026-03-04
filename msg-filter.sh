#!/bin/sh
if [ "$GIT_COMMIT" = "30f744ffb291ae0d034ee5bc9f02940f17d580b6" ]; then
  echo "feat(index): 瀹屾垚棣栭〉鍥涙爮鍒囨崲涓庡鎺ㄧ鍗″闆嗗競椤甸潰琛ュ厖"
elif [ "$GIT_COMMIT" = "fd48da303c58b7768a08ddac51af63597af40d5f" ]; then
  echo "feat: 鍚屾瀹舵帹瀹堕泦甯備簩绾т笁绾ч〉闈笌瀵艰埅淇"
else
  cat
fi
