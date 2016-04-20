function getMp3file() {
    const buffer = new ArrayBuffer(10);
    const uint8 = new Uint8Array(buffer);

    uint8.set([0xff, 0xfb, 0, 1, 2, 3, 4, 5, 6, 7]);

    return buffer;
}

function getMp3fileWithId3() {
    const buffer = new ArrayBuffer(10);
    const uint8 = new Uint8Array(buffer);

    uint8.set([0x49, 0x44, 0x33, 0, 1, 2, 3, 4, 5, 6]);

    return buffer;
}

function getNonMp3File() {
    const buffer = new ArrayBuffer(10);
    const uint8 = new Uint8Array(buffer);

    uint8.set([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);

    return buffer;
}

function typedArray2Array(typedArray) {
    return Array.prototype.slice.call(typedArray);
}

function encodeUtf8Ascii(str) {
    const codePoints = str.split('').map((c) => {
        const charCode = c.charCodeAt(0);
        if (charCode > 0x7F) {
            throw new Error('Trying to encode not ASCII symbol');
        }
        return charCode;
    });

    return new Uint8Array(codePoints);
}

function encodeUtf16le(str) {
    const codePoints = str.split('').map((c) => c.charCodeAt(0));
    const output = new Uint8Array(str.length * 2);

    new Uint16Array(output.buffer).set(codePoints);

    return output;
}

const files = {
    mp3: getMp3file(),
    mp3WithId3: getMp3fileWithId3(),
    nonMp3: getNonMp3File()
};

describe('ID3Writer', () => {

    it('should be possible to create an instance', () => {
        const writer = new ID3Writer(files.mp3);
        const writer2 = new ID3Writer(files.mp3WithId3);

        expect(writer).to.be.instanceof(ID3Writer);
        expect(writer2).to.be.instanceof(ID3Writer);
    });

    it('should throw an exception if non mp3 file is given', () => {
        expect(() => {
            new ID3Writer(files.nonMp3);
        }).to.throw(Error, 'ArrayBuffer is not an mp3 file or it is corrupted');
    });

    it('should throw an exception if no argument passed to constructor', () => {
        expect(() => {
            new ID3Writer();
        }).to.throw(Error, 'First argument should be an instance of ArrayBuffer');
    });

    it('wrong frame value type should throw an exception', () => {
        const frames = ['TPE1', 'TCOM', 'TCON'];
        const writer = new ID3Writer(files.mp3);

        frames.forEach((frameName) => {
            expect(() => {
                writer.setFrame(frameName, '');
            }).to.throw(Error, 'frame value should be an array of strings');
        });
    });

    it('should throw an exception with wrong frame name', () => {
        const writer = new ID3Writer(files.mp3);

        expect(() => {
            writer.setFrame('wrongFrameName', 'val');
        }).to.throw(Error, 'Unsupported frame');
    });

    describe('integer frames', () => {

        it('should correctly set TLEN frame', () => {
            const writer = new ID3Writer(files.mp3);
            writer.setFrame('TLEN', 7200000);

            const buffer = writer.addTag();
            const frameTotalSize = 18;
            const bufferUint8 = new Uint8Array(buffer, 10, frameTotalSize);

            expect(bufferUint8).to.eql(new Uint8Array([
                84, 76, 69, 78, // 'TLEN'
                0, 0, 0, frameTotalSize - 10, // size without header (should be less than 128)
                0, 0, // flags
                0, // encoding
                55, 50, 48, 48, 48, 48, 48 // frame value - 7200000
            ]));
        });

        it('should correctly set TYER frame', () => {
            const writer = new ID3Writer(files.mp3);
            writer.setFrame('TYER', 2011);

            const buffer = writer.addTag();
            const frameTotalSize = 15;
            const bufferUint8 = new Uint8Array(buffer, 10, frameTotalSize);

            expect(bufferUint8).to.eql(new Uint8Array([
                84, 89, 69, 82, // 'TYER'
                0, 0, 0, frameTotalSize - 10, // size without header (should be less than 128)
                0, 0, // flags
                0, // encoding
                50, 48, 49, 49 // 2011
            ]));
        });
    });


    describe('array of strings frames', () => {
        it('should correctly set TPE1 frame', () => {
            const writer = new ID3Writer(files.mp3);
            writer.setFrame('TPE1', ['Eminem', '50 Cent']);

            const buffer = writer.addTag();
            const frameTotalSize = 41;
            const bufferUint8 = new Uint8Array(buffer, 10, frameTotalSize);

            expect(bufferUint8).to.eql(new Uint8Array([
                84, 80, 69, 49, // 'TPE1'
                0, 0, 0, frameTotalSize - 10, // size without header (should be less than 128)
                0, 0, // flags
                1, 0xff, 0xfe, // encoding, BOM
                69, 0, 109, 0, 105, 0, 110, 0, 101, 0, 109, 0, 47, 0, // Eminem/
                53, 0, 48, 0, 32, 0, 67, 0, 101, 0, 110, 0, 116, 0 // 50 Cent
            ]));
        });
    });

    describe('string frames', () => {
        it('should correctly set TIT2 frame', () => {
            const writer = new ID3Writer(files.mp3);
            writer.setFrame('TIT2', 'Емеля - forge');

            const buffer = writer.addTag();
            const frameTotalSize = 39;
            const bufferUint8 = new Uint8Array(buffer, 10, frameTotalSize);

            expect(bufferUint8).to.eql(new Uint8Array([
                84, 73, 84, 50, // 'TIT2'
                0, 0, 0, frameTotalSize - 10, // size without header (should be less than 128)
                0, 0, // flags
                1, 0xff, 0xfe, // encoding, BOM
                21, 4, 60, 4, 53, 4, 59, 4, 79, 4, 32, 0, 45, 0, 32, 0, // Емеля -
                102, 0, 111, 0, 114, 0, 103, 0, 101, 0 // forge
            ]));
        });
    });

    it('should set USLT frame', () => {
        const lyrics = 'Вышел заяц на крыльцо. Rabbit went out.';
        const writer = new ID3Writer(files.mp3);

        writer.setFrame('USLT', lyrics);

        const buffer = writer.addTag();
        const frameTotalSize = lyrics.length * 2 + 20;
        const bufferUint8 = new Uint8Array(buffer, 10, frameTotalSize);

        expect(bufferUint8).to.eql(new Uint8Array([
                85, 83, 76, 84, // 'USLT'
                0, 0, 0, frameTotalSize - 10, // size without header (should be less than 128)
                0, 0, // flags
                1, // encoding
                101, 110, 103, // language
                0xff, 0xfe, // BOM
                0, 0, // content descriptor
                0xff, 0xfe // BOM
            ].concat(typedArray2Array(encodeUtf16le(lyrics)))
        ));
    });

    describe('APIC', () => {

        it('should throw error when value is not a buffer', () => {
            const writer = new ID3Writer(files.mp3);

            expect(() => {
                writer.setFrame('APIC', 4512);
            }).to.throw(Error, 'APIC frame value should be an instance of ArrayBuffer');
        });

        it('should throw error when mime type is not detected', () => {
            const writer = new ID3Writer(files.mp3);

            expect(() => {
                writer.setFrame('APIC', new ArrayBuffer(20));
            }).to.throw(Error, 'Unknown picture MIME type');
        });

        it('should throw error when buffer is empty', () => {
            const writer = new ID3Writer(files.mp3);

            expect(() => {
                writer.setFrame('APIC', new ArrayBuffer(0));
            }).to.throw(Error, 'Unknown picture MIME type');
        });

        it('should accept various image types', () => {
            const types = [{
                signature: [0xff, 0xd8, 0xff],
                mime: 'image/jpeg'
            }, {
                signature: [0x89, 0x50, 0x4e, 0x47],
                mime: 'image/png'
            }, {
                signature: [0x47, 0x49, 0x46],
                mime: 'image/gif'
            }, {
                signature: [0, 0, 0, 0, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50],
                mime: 'image/webp'
            }, {
                signature: [0x49, 0x49, 0x2a, 0],
                mime: 'image/tiff'
            }, {
                signature: [0x4d, 0x4d, 0, 0x2a],
                mime: 'image/tiff'
            }, {
                signature: [0x42, 0x4d],
                mime: 'image/bmp'
            }, {
                signature: [0, 0, 1, 0],
                mime: 'image/x-icon'
            }];
            const content = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

            types.forEach((type) => {
                const coverBuffer = new ArrayBuffer(type.signature.length + content.length);
                const coverUint8 = new Uint8Array(coverBuffer);

                coverUint8.set(type.signature);
                coverUint8.set(content, type.signature.length);

                const writer = new ID3Writer(files.mp3);

                writer.setFrame('APIC', coverBuffer);

                const buffer = writer.addTag();
                const frameTotalSize = type.mime.length + type.signature.length + content.length + 14;
                const bufferUint8 = new Uint8Array(buffer, 10, frameTotalSize);

                expect(bufferUint8).to.eql(new Uint8Array([
                        65, 80, 73, 67, // 'APIC'
                        0, 0, 0, frameTotalSize - 10, // size without header (should be less than 128)
                        0, 0, // flags
                        0 // encoding
                    ].concat(typedArray2Array(encodeUtf8Ascii(type.mime)))
                        .concat([0, 3, 0]) // delemiter, pic type, delemiter
                        .concat(type.signature)
                        .concat(content)
                ));
            });
        });

    });

});
