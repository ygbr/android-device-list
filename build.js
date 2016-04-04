#!/usr/bin/env node

'use strict';

const fs = require( 'fs' );
const path = require( 'path' );
const axios = require( 'axios' );
const iconv = require( 'iconv-lite' );

// https://support.google.com/googleplay/android-developer/answer/6154891?hl=en
// https://support.google.com/googleplay/answer/1727131?hl=en

// On the CSV file, devices are ordered alphabetically (A-Z) by manufacturer name and listed in the following format:
//  Retail brand, marketing name, build.os.DEVICE, build.os.MODEL

const SUPPORTED_DEVICES_CSV = 'https://storage.googleapis.com/play_public/supported_devices.csv';

const DEVICES_OUTPUT_FILE = path.join( __dirname, 'devices.json' );
const BRANDS_OUTPUT_FILE = path.join( __dirname, 'brands.json' );

const CVS_SEPARATOR = ',';
const CVS_QUOTE = '"';
const CVS_ESCAPE = '"';
const CVS_NEWLINE = '\r\n';

const CVS_SEPARATOR_CODE = new Buffer( CVS_SEPARATOR )[0];
const CVS_QUOTE_CODE = new Buffer( CVS_QUOTE )[0];
const CVS_ESCAPE_CODE = new Buffer( CVS_ESCAPE )[0];


function getCvs () {
  console.log( 'Downloading: ' + SUPPORTED_DEVICES_CSV );

  axios.get( SUPPORTED_DEVICES_CSV )
    .then( buildJSON )
    .catch( e => {
      console.log( 'Download failed' );
      console.log( e );
    } );
}

// convert utf-16le to utf8
function decodeRaw ( data ) {
  // check file encoding:
  // $ file -I supported_devices.csv
  // supported_devices.csv: text/plain; charset=utf-16le

  let buffer = new Buffer( data, 'binary' );
  return iconv.decode( buffer, 'utf-16le' );
}

function buildJSON ( response ) {

//  console.log(response.data);
//  console.log(response.status);
//  console.log(response.statusText);
//  console.log(response.headers);
//  console.log(response.config);

  console.log( 'Downloaded', response.status, response.statusText );
  console.log( 'File size: ' + response.headers['content-length'] + ' bytes' );

  let devices = parseCVS( decodeRaw( response.data ) );

  // remove first row: "Retail Branding,Marketing Name,Device,Model"
  devices.shift();

  console.log( devices.length + ' devices' );

  fs.writeFile( DEVICES_OUTPUT_FILE, JSON.stringify( devices, null, 2 ), ( err ) => {
    if ( err ) {
      throw err;
    }
    console.log( 'Device list saved to ' + DEVICES_OUTPUT_FILE );
  } );

  let brands = [];
  devices.forEach( device => {
    if ( !device.brand ) {
      return;
    }
    if ( brands.indexOf( device.brand ) === -1 ) {
      brands.push( device.brand );
    }
  } );

  console.log( brands.length + ' brands' );

  fs.writeFile( BRANDS_OUTPUT_FILE, JSON.stringify( brands, null, 2 ), ( err ) => {
    if ( err ) {
      throw err;
    }
    console.log( 'Brand list saved to ' + BRANDS_OUTPUT_FILE );
  } );

}

function parseCVS ( data ) {
  let dataArr = data.split( CVS_NEWLINE );
  let out = [];

  dataArr.map( item => {
    let parts = splitRow( item );
    if ( parts ) {
      out.push( {
        brand: parts[0],
        name: parts[1],
        device: parts[2],
        model: parts[3]
      } );
    }
  } );

  return out;
}

function splitRow ( row ) {
  let parts;
  if ( ( row.indexOf( CVS_QUOTE ) > -1 ) || ( row.indexOf( CVS_ESCAPE ) > -1 ) ) {
    parts = splitSpecial( row );
  } else {
    parts = row.split( CVS_SEPARATOR );
  }
  if ( row.trim().length === 0 ) {
    // empty row
    return;
  }
  if ( parts.length !== 4 ) {
    console.log( 'Invalid row:', row, row.length, parts );
    return;
  }
  return parts;
}

function splitSpecial ( data ) {
  if ( typeof data === 'string' ) {
    data = new Buffer( data );
  }

  let start = 0;
  let end = data.length;
  let cells = [];
  let isQuoted = false;
  let offset = start;

  for ( let i = start; i < end; i++ ) {
    let isStartingQuote = !isQuoted && data[i] === CVS_QUOTE_CODE;
    let isEndingQuote = isQuoted && data[i] === CVS_QUOTE_CODE && i + 1 <= end && data[i + 1] === CVS_SEPARATOR_CODE;
    let isEscape = isQuoted && data[i] === CVS_ESCAPE_CODE && i + 1 < end && data[i + 1] === CVS_QUOTE_CODE;

    if ( isStartingQuote || isEndingQuote ) {
      isQuoted = !isQuoted;
      continue;
    } else if ( isEscape ) {
      i++;
      continue;
    }

    if ( data[i] === CVS_SEPARATOR_CODE && !isQuoted ) {
      cells.push( cell( data, offset, i ) );
      offset = i + 1;
    }
  }

  if ( offset < end ) {
    cells.push( cell( data, offset, end ) );
  }
  if ( data[end - 1] === CVS_SEPARATOR_CODE ) {
    cells.push( '' );
  }

  return cells;
}

function cell ( data, start, end ) {
  // remove quotes from quoted cells
  let quotes = 0;

  if ( data[start] === CVS_QUOTE_CODE && data[end - 1] === CVS_QUOTE_CODE ) {
    start++;
    end--;
    quotes = 1;
  }

  let i = start;
  let y = start;
  for ( ; i < end; i++ ) {
    // check for escape characters and skip them
    if ( data[i] === CVS_ESCAPE_CODE && i + 1 < end && data[i + 1] === CVS_QUOTE_CODE ) {
      i++;
    }
    if ( y !== i ) {
      data[y] = data[i];
    }
    y++;
  }

  return data.toString( 'utf-8', start, end - quotes );
}



// start
getCvs();
