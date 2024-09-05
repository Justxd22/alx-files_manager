import { ObjectId } from 'mongodb';
import Queue from 'bull';
import { promises as fsPromises } from 'fs';
import { v4 as uuidv4 } from 'uuid';
import dbClient from '../utils/db';
import userUtils from '../utils/user';
import valid from '../utils/valid';

const FOLDER_PATH = process.env.FOLDER_PATH || '/tmp/files_manager';

const fileQueue = new Queue('fileQueue');
class FilesController {
  static async postUpload(req, res) {
    const user = await userUtils.getUserFromReq(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const id = user._id;

    const {
      name, type, isPublic = false, data,
    } = req.body;

    const types = ['file', 'image', 'folder'];
    let err = null;
    let { parentId = 0 } = req.body;
    if (parentId === '0') parentId = 0;

    if (!name) {
      err = 'Missing name';
    } else if (!type || !types.includes(type)) {
      err = 'Missing type';
    } else if (!data && type !== 'folder') {
      err = 'Missing data';
    } else if (parentId && parentId !== '0') {
      let file;

      if (valid.idOkay(parentId)) {
        file = await dbClient.db.collection('files').findOne({ _id: ObjectId(parentId) });
      } else {
        file = null;
      }

      if (!file) {
        err = 'Parent not found';
      } else if (file.type !== 'folder') {
        err = 'Parent is not a folder';
      }
    }
    if (err) { return res.status(400).send({ error: err }); }

    if (parentId !== 0 && !valid.idOkay(parentId)) { return res.status(400).send({ error: 'Parent not found' }); }

    const query = {
      userId: ObjectId(id),
      name,
      type,
      isPublic,
      parentId,
    };

    if (type !== 'folder') {
      const fileNameUUID = uuidv4();

      const fileDataDecoded = Buffer.from(data, 'base64');

      const path = `${FOLDER_PATH}/${fileNameUUID}`;

      query.localPath = path;

      try {
        await fsPromises.mkdir(FOLDER_PATH, { recursive: true });
        await fsPromises.writeFile(path, fileDataDecoded);
      } catch (err) {
        if (type === 'image') await fileQueue.add({ id });
        return res.status(400).send(err.message);
      }
    }

    const result = await dbClient.db.collection('files').insertOne(query);
    const newFile = { id: result.insertedId, ...query };
    delete newFile.localPath;
    delete newFile._id;

    if (type === 'image') {
      await fileQueue.add({
        fileId: result.insertedId.toString(),
        userId: newFile.userId.toString(),
      });
    }

    return res.status(201).send(newFile);
  }

  static async getShow(req, res) {
    const user = await userUtils.getUserFromReq(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const id = user._id;

    const fileId = req.params.id;

    if (!valid.idOkay(fileId) || !valid.idOkay(id)) { return res.status(404).send({ error: 'Not found' }); }

    const result = await dbClient.db.collection('files').findOne({
      _id: ObjectId(fileId),
      userId: ObjectId(id),
    });

    if (!result) return res.status(404).send({ error: 'Not found' });

    const file = { id: result._id, ...result };
    delete file.localPath;
    delete file._id;

    return res.status(200).send(file);
  }

  static async getIndex(req, res) {
    const user = await userUtils.getUserFromReq(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    let parentId = req.query.parentId || '0';
    if (parentId === '0') parentId = 0;

    let page = Number(req.query.page) || 0;

    if (Number.isNaN(page)) page = 0;

    if (parentId !== 0 && parentId !== '0') {
      if (!valid.idOkay(parentId)) { return res.status(401).send({ error: 'Unauthorized' }); }

      const folder = await dbClient.db.collection('files').findOne({
        _id: ObjectId(parentId),
      });

      if (!folder || folder.type !== 'folder') { return res.status(200).send([]); }
    }

    const pipeline = [
      { $match: { parentId } },
      { $skip: page * 20 },
      { $limit: 20 },
    ];

    const fileCursor = await dbClient.db.collection('files').aggregate(pipeline);

    const fileList = [];
    await fileCursor.forEach((doc) => {
      const document = { id: doc._id, ...doc };
      delete document.localPath;
      delete document._id;
      fileList.push(document);
    });

    return res.status(200).send(fileList);
  }
}

export default FilesController;
