// Vercel Serverless Function: Serves Apple OTA manifest.plist for itms-services
export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { url, bundleId, title, version } = req.query;

  if (!url) {
    return res.status(400).send('Missing "url" parameter for IPA download');
  }

  let finalIpaUrl = decodeURIComponent(url);

  // Case 1: URL is from tmpfiles.org (e.g. https://tmpfiles.org/XXXXXX/app.ipa)
  // Resolve the direct download token link from the page HTML on the server side
  if (finalIpaUrl.includes('tmpfiles.org/') && !finalIpaUrl.includes('/dl/')) {
    try {
      const pageRes = await fetch(finalIpaUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15'
        }
      });
      if (pageRes.ok) {
        const html = await pageRes.text();
        const match = html.match(/href="([^"]+test\.ipa)"/) || html.match(/href="(https:\/\/tmpfiles\.org\/dl\/[^"]+)"/);
        if (match && match[1]) {
          finalIpaUrl = match[1];
        } else {
          // Fallback to direct /dl/ URL pattern
          finalIpaUrl = finalIpaUrl.replace('tmpfiles.org/', 'tmpfiles.org/dl/');
        }
      }
    } catch (e) {
      console.warn('Could not resolve direct tmpfiles URL, falling back:', e);
      finalIpaUrl = finalIpaUrl.replace('tmpfiles.org/', 'tmpfiles.org/dl/');
    }
  }

  // Case 2: URL is from filebin.net (e.g. https://filebin.net/ota-xxx/app.ipa)
  // Resolve direct S3 presigned URL on the server side
  else if (finalIpaUrl.includes('filebin.net/')) {
    try {
      const redirectRes = await fetch(finalIpaUrl, {
        headers: { 'User-Agent': 'curl/8.0.0' },
        redirect: 'manual'
      });
      const s3Location = redirectRes.headers.get('location');
      if (s3Location) {
        finalIpaUrl = s3Location;
      }
    } catch (e) {
      console.warn('Could not resolve S3 URL for filebin:', e);
    }
  }

  const appBundleId = bundleId || 'com.app.signed';
  const appTitle = title || 'iOS Application';
  const appVersion = version || '1.0.0';

  const plistContent = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
	<key>items</key>
	<array>
		<dict>
			<key>assets</key>
			<array>
				<dict>
					<key>kind</key>
					<string>software-package</string>
					<key>url</key>
					<string><![CDATA[${finalIpaUrl}]]></string>
				</dict>
			</array>
			<key>metadata</key>
			<dict>
				<key>bundle-identifier</key>
				<string>${escapeXml(appBundleId)}</string>
				<key>bundle-version</key>
				<string>${escapeXml(appVersion)}</string>
				<key>kind</key>
				<string>software</string>
				<key>title</key>
				<string><![CDATA[${appTitle}]]></string>
			</dict>
		</dict>
	</array>
</dict>
</plist>`;

  res.setHeader('Content-Type', 'application/x-plist; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  return res.status(200).send(plistContent);
}

function escapeXml(unsafe) {
  return String(unsafe || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
