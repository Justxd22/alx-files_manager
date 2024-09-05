import { ObjectId } from 'mongodb';

const valid = {
  idOkay(id) {
    try {
      ObjectId(id);
      return true;
    } catch (err) {
      return false;
    }
  },
};

export default valid;
