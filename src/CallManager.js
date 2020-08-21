import firestore from '@react-native-firebase/firestore';

// TODO Fix this whole file
class CallManager {
  constructor() {
    this.id = -1;
  }

  initialize(id) {
    this.id = id;
  }

  enter(toId, isPrivate) {
    isPrivate = typeof isPrivate === 'boolean' ? isPrivate : false;
    let friendDocRef = firestore()
      .collection('users')
      .doc(toId);
    let myDocRef = firestore()
      .collection('users')
      .doc(this.id);
    firestore().runTransaction(async tx => {
      /*
      let friendDoc = await tx.get(friendDocRef);
      let friendRoomId = "roomId" in friendDoc.data() ? friendDoc.data()["roomId"] : ""
      let myDoc = await tx.get(myDocRef);
      let myRoomId = "roomId" in myDoc.data() ? myDoc.data()["roomId"] : ""
      */
      let myRoomId = '';
      let friendRoomId = '';
      if (friendRoomId === '' && myRoomId === '') {
        // new room
        let roomRef = firestore()
          .collection('rooms')
          .doc();
        tx.update(myDocRef, {
          roomId: roomRef.id,
        });
        tx.update(friendDocRef, {
          roomId: roomRef.id,
        });
        tx.set(roomRef, {
          isPrivate: isPrivate,
          users: {
            [this.id]: true,
            [toId]: true,
          },
        });
      } else if (friendRoomId === myRoomId) {
        // in this case, we're just updating isPrivate
        let ourRoomRef = firestore()
          .collection('rooms')
          .doc(myRoomId);
        tx.update(ourRoomRef, {
          isPrivate: isPrivate,
        });
        tx.update(myDocRef, {});
        tx.update(friendDocRef, {});
      } else if (friendRoomId !== '' && myRoomId !== '') {
        tx.update(friendDocRef, {});
        tx.update(myDocRef, {});
        // we're both in different calls, ignore
      } else if (friendRoomId !== '' && myRoomId === '') {
        // TODO what is the expected behavior if friend is already
        // in a call?
        tx.update(myDocRef, {});
        tx.update(friendDocRef, {});
      } else if (friendRoomId === '' && myRoomId !== '') {
        // friend joins us
        let roomRef = firestore()
          .collection('rooms')
          .doc(myRoomId);
        tx.update(myDocRef, {});
        tx.update(friendDocRef, {
          roomId: myRoomId,
        });
        tx.update(roomRef, {
          ['users.' + toId]: true,
        });
      }
    });
  }

  exit() {
    let myDocRef = firestore()
      .collection('users')
      .doc(this.id);
    firestore().runTransaction(async tx => {
      let myDoc = await tx.get(myDocRef);
      let roomId = myDoc.data()['roomId'];
      if (!roomId) {
        tx.update(myDocRef, {roomId: ''});
      } else {
        let roomRef = firestore()
          .collection('rooms')
          .doc(roomId);
        let roomDoc = await tx.get(roomRef);
        if (Object.keys(roomDoc.data()['users']).length <= 1) {
          tx.delete(roomRef);
        } else {
          tx.update(roomRef, {
            ['users.' + this.id]: firestore.FieldValue.delete(),
          });
        }
        tx.update(myDocRef, {
          roomId: '',
        });
      }
    });
  }
}

export default CallManager;
