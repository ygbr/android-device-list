import test from 'ava';

const devices = require( './index' );

test( 'deviceList()', t => {
  t.is( typeof devices.deviceList, 'function' );
  t.ok( Array.isArray( devices.deviceList() ) );
} );

test( 'brandList()', t => {
  t.is( typeof devices.brandList, 'function' );
  t.ok( Array.isArray( devices.brandList() ) );
} );

test( 'getDevicesByBrand()', t => {
  t.is( typeof devices.getDevicesByBrand, 'function' );
  t.throws( function () { devices.getDevicesByBrand(); } );
  t.ok( Array.isArray( devices.getDevicesByBrand( '' ) ) );
} );

test( 'getDevicesByName()', t => {
  t.is( typeof devices.getDevicesByName, 'function' );
  t.throws( function () { devices.getDevicesByName(); } );
  t.ok( Array.isArray( devices.getDevicesByName( '' ) ) );
} );

test( 'getDevicesByDeviceId()', t => {
  t.is( typeof devices.getDevicesByDeviceId, 'function' );
  t.throws( function () { devices.getDevicesByDeviceId(); } );
  t.ok( Array.isArray( devices.getDevicesByDeviceId( '' ) ) );
} );

test( 'getDevicesByModel()', t => {
  t.is( typeof devices.getDevicesByModel, 'function' );
  t.throws( function () { devices.getDevicesByModel(); } );
  t.ok( Array.isArray( devices.getDevicesByModel( '' ) ) );
} );
