import { ObjectId } from 'mongodb';
import { promises as fsPromises } from 'fs';
import valid from './valid';
import userUtils from './user';
import dbClient from './db';

const files = {
  async publishOR(req, iS) {
    const { id: fileId } = req.params;

    if (!valid.idOkay(fileId)) { return { error: 'Unauthorized', code: 401 }; }

    const user = await userUtils.getUserFromReq(req);
    if (!user) return { error: 'Unauthorized', code: 401 };

    const file = await dbClient.db.collection('files').findOne({
      _id: ObjectId(fileId),
      userId: ObjectId(user._id),
    });

    if (!file) return { error: 'Not found', code: 404 };

    const result = await dbClient.db.collection('files').findOneAndUpdate(
      {
        _id: ObjectId(fileId),
        userId: ObjectId(user._id),
      },
      { $set: { isPublic: iS } },
      { returnOriginal: false },
    );

    const {
      _id: id,
      userId: resultUserId,
      name,
      type,
      isPublic,
      parentId,
    } = result.value;

    const updatedFile = {
      id,
      userId: resultUserId,
      name,
      type,
      isPublic,
      parentId,
    };

    return { error: null, code: 200, updatedFile };
  },

  isOwnerAndPublic(file, userId) {
    if (
      (!file.isPublic && !userId)
      || (userId && file.userId.toString() !== userId && !file.isPublic)
    ) { return false; }

    return true;
  },

  async getFileData(file, size) {
    let { localPath } = file;
    let data;

    if (size) localPath = `${localPath}_${size}`;

    try {
      data = await fsPromises.readFile(localPath);
    } catch (err) {
      // console.log(err.message);
      return { error: 'Not found', code: 404 };
    }

    return { data };
  },
};

export default files;
