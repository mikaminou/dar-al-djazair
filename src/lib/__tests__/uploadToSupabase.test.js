/**
 * Tests for src/lib/uploadToSupabase.js
 *
 * Supabase client is fully mocked — no network access.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Mock supabase client ─────────────────────────────────────────────────────

const mockGetUser = vi.fn();
const mockUpload = vi.fn();
const mockGetPublicUrl = vi.fn();
const mockCreateSignedUrl = vi.fn();

const mockBucketChain = () => ({
  upload: mockUpload,
  getPublicUrl: mockGetPublicUrl,
  createSignedUrl: mockCreateSignedUrl,
});

vi.mock('@/lib/supabaseClient', () => ({
  supabase: {
    auth: { getUser: mockGetUser },
    storage: { from: vi.fn(() => mockBucketChain()) },
  },
}));

const { uploadToSupabase } = await import('@/lib/uploadToSupabase.js');

// ─────────────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
});

function makeFile(name = 'photo.jpg', type = 'image/jpeg') {
  return new File(['data'], name, { type });
}

describe('uploadToSupabase', () => {
  it('throws when the user is not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    await expect(uploadToSupabase(makeFile())).rejects.toThrow(
      'Must be authenticated to upload files'
    );
  });

  it('uploads to the default listing-photos bucket', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'uid-abc' } } });
    mockUpload.mockResolvedValue({ error: null });
    mockGetPublicUrl.mockReturnValue({ data: { publicUrl: 'https://cdn.example.com/file.jpg' } });

    const result = await uploadToSupabase(makeFile('photo.jpg', 'image/jpeg'));

    expect(mockUpload).toHaveBeenCalledOnce();
    const [path, , opts] = mockUpload.mock.calls[0];
    expect(path.startsWith('uid-abc/')).toBe(true);
    expect(path.endsWith('.jpg')).toBe(true);
    expect(opts.contentType).toBe('image/jpeg');
    expect(result.url).toBe('https://cdn.example.com/file.jpg');
    expect(result.bucket).toBe('listing-photos');
  });

  it('uploads to a custom bucket', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'uid-xyz' } } });
    mockUpload.mockResolvedValue({ error: null });
    mockGetPublicUrl.mockReturnValue({ data: { publicUrl: 'https://cdn.example.com/avatar.png' } });

    await uploadToSupabase(makeFile('avatar.png', 'image/png'), 'profile-avatars');

    const [path] = mockUpload.mock.calls[0];
    expect(path.startsWith('uid-xyz/')).toBe(true);
    expect(path.endsWith('.png')).toBe(true);
  });

  it('uses a signed URL for private buckets (documents)', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'uid-priv' } } });
    mockUpload.mockResolvedValue({ error: null });
    mockCreateSignedUrl.mockResolvedValue({ data: { signedUrl: 'https://cdn.example.com/signed.pdf' }, error: null });

    const result = await uploadToSupabase(makeFile('doc.pdf', 'application/pdf'), 'documents');

    expect(mockCreateSignedUrl).toHaveBeenCalledOnce();
    expect(mockGetPublicUrl).not.toHaveBeenCalled();
    expect(result.url).toBe('https://cdn.example.com/signed.pdf');
    expect(result.bucket).toBe('documents');
  });

  it('uses a signed URL for private buckets (receipts)', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'uid-priv' } } });
    mockUpload.mockResolvedValue({ error: null });
    mockCreateSignedUrl.mockResolvedValue({ data: { signedUrl: 'https://cdn.example.com/receipt.pdf' }, error: null });

    const result = await uploadToSupabase(makeFile('receipt.pdf', 'application/pdf'), 'receipts');
    expect(result.url).toBe('https://cdn.example.com/receipt.pdf');
  });

  it('throws when storage upload fails', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'uid-fail' } } });
    mockUpload.mockResolvedValue({ error: { message: 'bucket not found', name: 'StorageError' } });

    await expect(uploadToSupabase(makeFile())).rejects.toMatchObject({ message: 'bucket not found' });
  });

  it('throws when createSignedUrl fails', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'uid-priv' } } });
    mockUpload.mockResolvedValue({ error: null });
    mockCreateSignedUrl.mockResolvedValue({ data: null, error: { message: 'sign failed', name: 'StorageError' } });

    await expect(uploadToSupabase(makeFile('d.pdf', 'application/pdf'), 'documents')).rejects.toMatchObject({
      message: 'sign failed',
    });
  });

  it('includes opts.prefix in the storage path', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'uid-pfx' } } });
    mockUpload.mockResolvedValue({ error: null });
    mockGetPublicUrl.mockReturnValue({ data: { publicUrl: 'https://cdn.example.com/photo.jpg' } });

    await uploadToSupabase(makeFile(), 'listing-photos', { prefix: 'gallery' });

    const [path] = mockUpload.mock.calls[0];
    expect(path).toMatch(/^uid-pfx\/gallery\//);
  });
});

describe('file extension detection', () => {
  const cases = [
    ['photo.jpg',  'image/jpeg',       '.jpg'],
    ['photo.PNG',  'image/png',        '.png'],
    ['vid.mp4',    'video/mp4',        '.mp4'],
    ['doc.pdf',    'application/pdf',  '.pdf'],
    ['img.webp',   'image/webp',       '.webp'],
    ['noext',      'image/jpeg',       '.jpg'],  // fallback to mime
    ['noext',      'image/png',        '.png'],
    ['unknown',    '',                 '.bin'],  // ultimate fallback
  ];

  for (const [name, type, expectedExt] of cases) {
    it(`picks ${expectedExt} for ${name} (${type || 'no mime'})`, async () => {
      mockGetUser.mockResolvedValue({ data: { user: { id: 'uid-ext' } } });
      mockUpload.mockResolvedValue({ error: null });
      mockGetPublicUrl.mockReturnValue({ data: { publicUrl: 'https://cdn.example.com/f' + expectedExt } });

      await uploadToSupabase(new File(['x'], name, { type }), 'listing-photos');
      const [path] = mockUpload.mock.calls[0];
      expect(path.endsWith(expectedExt)).toBe(true);
    });
  }
});
