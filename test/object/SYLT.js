const fs = require('fs');
const assert = require('assert');
const ID3Writer = require('../../dist/browser-id3-writer');

const emptyBuffer = new ArrayBuffer(0);
const id3Header = [
    73, 68, 51, // ID3 magic nubmer
    3, 0, // version
    0, // flags
];
const bom = [0xff, 0xfe];
const sep = [0, 0];

describe('SYLT', () => {
    it('SYLT', () => {
        // const writer = new ID3Writer(emptyBuffer);
        // writer.padding = 0;
        // writer.setFrame('SYLT', {
        //     type: 1,
        //     description: 'wat',
        //     text: [{
        //         timestamp: 2000,
        //         text: 'hi',
        //     }, {
        //         timestamp: 3000,
        //         text: 'my name is',
        //     }, {
        //         timestamp: 5000,
        //         text: 'who',
        //     }, {
        //         timestamp: 6000,
        //         text: '',
        //     }],
        // });
        // writer.addTag();
        // const actual = new Uint8Array(writer.arrayBuffer);
        const expected = new Uint8Array([
            ...id3Header,
            0, 0, 0, 88, // tag size without header
            83, 89, 76, 84, // 'SYLT'
            0, 0, 0, 78, // size without header
            0, 0, // flags
            1, // encoding
            101, 110, 103, // language
            2, // time stamp format
            1, // content type
            ...bom, 119, 0, 97, 0, 116, 0, ...sep, // 'wat'
            ...bom, 104, 0, 105, 0, ...sep, // 'hi'
            0, 0, 7, 208, // 2000
            ...bom, 109, 0, 121, 0, 32, 0, 110, 0, 97, 0, 109, 0, 101, 0, 32, 0, 105, 0, 115, 0, ...sep, // 'my name is'
            0, 0, 11, 184, // 3000
            ...bom, 119, 0, 104, 0, 111, 0, ...sep, // 'who'
            0, 0, 19, 136, // 5000
            ...bom, ...sep, // ''
            0, 0, 23, 112, // 6000
        ]);
        const song = fs.readFileSync('song.mp3');
        const id3 = new Buffer(expected);
        const res = Buffer.concat([id3, song]);
        fs.writeFileSync('sylt.mp3', res);
        // assert.deepStrictEqual(actual, expected);
    });
});
