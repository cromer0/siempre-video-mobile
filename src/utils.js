import { SWIPE_VELOCITY_THRESHOLD, DIRECTION_OFFSET_THRESHOLD, GESTURE_IS_CLICK_THRESHOLD } from './constants';

function getConversationId(id1, id2) {
  if (id1 < id2) {
    return id1 + "_" + id2;
  }
  return id2 + "_" + id1;
}

function generateId(length) {
   var result = '';
   var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
   var charactersLength = characters.length;
   for ( var i = 0; i < length; i++ ) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
   }
   return result;
}

function isValidSwipe(velocity, velocityThreshold, directionalOffset, directionalOffsetThreshold) {
  return (
    Math.abs(velocity) > velocityThreshold && Math.abs(directionalOffset) < directionalOffsetThreshold
  );
}

function getSwipeDirection(gestureState) {
  const { dx, dy, vx, vy } = gestureState;
  // valid horizontal swipe
  // use vx, vy, instead of dx, dy: sometimes the d's are 0
  if (isValidSwipe(vx, SWIPE_VELOCITY_THRESHOLD, dy, DIRECTION_OFFSET_THRESHOLD)) {
    return vx > 0 ? 'SWIPE_RIGHT' : 'SWIPE_LEFT';
  } else if (isValidSwipe(vy, SWIPE_VELOCITY_THRESHOLD, dx, DIRECTION_OFFSET_THRESHOLD)) {
    return vy > 0 ? 'SWIPE_DOWN' : 'SWIPE_UP';
  }

  return null;
}

function gestureIsClick(gestureState) {
  return (
    Math.abs(gestureState.dx) < GESTURE_IS_CLICK_THRESHOLD &&
    Math.abs(gestureState.dy) < GESTURE_IS_CLICK_THRESHOLD
  );
}

export { getConversationId, generateId, getSwipeDirection, gestureIsClick };
