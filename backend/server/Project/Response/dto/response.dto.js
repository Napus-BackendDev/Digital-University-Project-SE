'use strict';

const { mapUserDto } = require('../../User/dto/user.dto');

const toPlainObject = function (value) {
  if (!value) return value;
  if (typeof value.toObject === 'function') return value.toObject();
  if (typeof value.toJSON === 'function') return value.toJSON();
  return JSON.parse(JSON.stringify(value));
};

const mapResponseDto = function (doc) {
  if (!doc) return doc;

  const cleanDoc = toPlainObject(doc);

  if (cleanDoc.responder && typeof cleanDoc.responder === 'object') {
    cleanDoc.responder = mapUserDto(cleanDoc.responder);
  }

  if (cleanDoc.form && typeof cleanDoc.form === 'object') {
    cleanDoc.form = toPlainObject(cleanDoc.form);

    if (cleanDoc.form.creator && typeof cleanDoc.form.creator === 'object') {
      cleanDoc.form.creator = mapUserDto(cleanDoc.form.creator);
    }

    if (Array.isArray(cleanDoc.form.responses)) {
      cleanDoc.form.responses = cleanDoc.form.responses.map((item) => {
        const cleanItem = toPlainObject(item);
        if (cleanItem && cleanItem.responder && typeof cleanItem.responder === 'object') {
          cleanItem.responder = mapUserDto(cleanItem.responder);
        }
        return cleanItem;
      });
    }
  }

  return cleanDoc;
};

const mapResponseListDto = function (docs) {
  if (!Array.isArray(docs)) return docs;
  return docs.map((doc) => mapResponseDto(doc));
};

module.exports = {
  mapResponseDto,
  mapResponseListDto,
};
