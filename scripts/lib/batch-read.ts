import { DocumentData } from '@google-cloud/firestore';
import utils from './utils';
import config from '../config';
import db from './db';
import { IFindKeywordInObjectFieldsParams, IPrintLengthParams } from './types';
import helpers from './helpers';
import path from 'path';

// DO NOT WRITE ANYTHING USING THIS SCRIPT
// USE batch-write instead

const {
  COLLECTION_NAME,
  CONCERNED_FIELDS,
  MATCH_KEYWORD,
  MATCH_PROPERTY,
  MATCH_VALUE
} = config.READ;

function findKeywordInField(keyword: string, value: string) {
  const present = value.toLowerCase().includes(keyword.toLowerCase());
  return present ? value : false;
}

function findKeywordInObjectFields({
  object,
  fields,
  keyword
}: IFindKeywordInObjectFieldsParams) {
  let keywordExists = false;
  fields.forEach(field => {
    const value = object[field];
    const valueWithKeyword = findKeywordInField(keyword, value);
    if (valueWithKeyword) {
      keywordExists = true;
    }
  });
  return keywordExists ? object : null;
}

function printLength(obj: IPrintLengthParams) {
  const key = Object.keys(obj)[0];
  const length = obj[key].length;
  console.log(key, ':', length);
}

async function batchRead() {
  const allDocuments = await helpers.getAllFromColection(db)(COLLECTION_NAME);
  helpers.writeArrayToJsonFile(
    allDocuments,
    path.resolve(`./data/read/all-${COLLECTION_NAME}.json`)
  );
  process.exit();
  // the matchObj can take on multiple sets of keys and values. currently we are using it only for one set
  const matchObj = {
    [MATCH_PROPERTY]: MATCH_VALUE
  };
  const matchedDocuments = helpers.matchDocuments(allDocuments, matchObj);
  require('process').exit();
  // matchedDocuments option A - find by single property-value match

  // matchedDocuments option B - find by presence of keyword in selected fields
  // const matchedDocuments = allDocuments.filter(item =>
  //   findKeywordInObjectFields({
  //     object: item,
  //     fields: CONCERNED_FIELDS,
  //     keyword: MATCH_KEYWORD
  //   })
  // );

  const alreadyReflecting = matchedDocuments.filter(
    document => document[MATCH_PROPERTY] === MATCH_KEYWORD
  );
  const hasOtherValue = matchedDocuments.filter(
    document =>
      document[MATCH_PROPERTY] && document[MATCH_PROPERTY] !== MATCH_KEYWORD
  );
  const valueUndefined = matchedDocuments.filter(
    document => document[MATCH_PROPERTY] === undefined
  );
  const result = {
    alreadyReflecting,
    hasOtherValue,
    matchedDocuments,
    valueUndefined
  };
  return result;
}

export default batchRead;
