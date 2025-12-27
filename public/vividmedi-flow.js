<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>VividMedi | Verify Medical Certificate</title>

  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600&display=swap" rel="stylesheet">

  <style>
    *{margin:0;padding:0;box-sizing:border-box;font-family:'Poppins',sans-serif;}
    body{
      background:#f9fbfc;
      display:flex;
      flex-direction:column;
      align-items:center;
      justify-content:flex-start;
      padding:40px 15px;
      min-height:100vh;
    }

    .header{text-align:center;margin-bottom:25px;}
    .brand{font-size:2.2rem;font-weight:600;color:#111;}
    .brand span{color:#4AA7FF;}
    .tagline{
      margin-top:8px;
      font-size:.95rem;
      color:#111;
      font-weight:500;
      line-height:1.4;
    }
    .tagline span{
      display:block;
      color:#555;
      font-weight:400;
      font-size:.9rem;
    }

    .verify-container{
      background:#fff;
      width:100%;
      max-width:600px;
      padding:35px;
      border-radius:16px;
      box-shadow:0 6px 20px rgba(0,0,0,.08);
      margin-top:25px;
      text-align:center;
    }

    h2{font-size:1.3rem;margin-bottom:10px;}
    p{color:#555;font-size:.95rem;margin-bottom:20px;}

    input{
      width:100%;
      padding:12px;
      border:1px solid #ccc;
      border-radius:8px;
      font-size:1rem;
      margin-bottom:15px;
      text-align:center;
    }

    button{
      width:100%;
      padding:14px;
      border:none;
      border-radius:8px;
      background:linear-gradient(to right,#4AA7FF,#7BE8D9);
      color:#fff;
      font-weight:600;
      font-size:1rem;
      cursor:pointer;
      transition:opacity .3s;
    }
    button:hover{opacity:0.9;}

    .result{
      margin-top:25px;
      text-align:left;
      border-radius:10px;
      padding:15px;
      background:#f9fafb;
      border:1px solid #e0e0e0;
      font-size:.95rem;
      line-height:1.5;
    }

    .valid{border-color:#00b67a;background:#f5fff7;}
    .invalid{border-color:#ff6b6b;background:#fff5f5;}
    .back-link{
      margin-top:25px;
      display:inline-block;
      color:#4AA7FF;
      text-decoration:none;
      font-weight:500;
    }

    .footer-note{
      margin-top:50px;
      font-size:.85rem;
      color:#777;
      text-align:center;
    }
  </style>
</head>
<body>

  <div class="header">
    <h1 class="brand">Vivid<span>Medi</span></h1>
    <p class="tagline">
      Medical Certificates — from payment to your inbox in under 15 minutes<br>
      <span>Reviewed & Issued by AHPRA-Registered Doctors<br>Accepted by Employers & Universities Australia-Wide</span>
    </p>
  </div>

  <div class="verify-container">
    <h2>Verify a Medical Certificate</h2>
    <p>Enter the certificate number (e.g. <strong>MEDC123456</strong>) to confirm authenticity.</p>
    <input type="text" id="codeInput" placeholder="Enter MEDC code" maxlength="10">
    <button id="verifyBtn">Verify</button>

    <div id="result" class="result" style="display:none;"></div>

    <a href="/" class="back-link">← Back to Request Page</a>
  </div>

  <p class="footer-note">© 2025 VividMedi. All certificates are verified against secure issuance records.</p>

  <script>
    const verifyBtn = document.getElementById('verifyBtn');
    const codeInput = document.getElementById('codeInput');
    const resultBox = document.getElementById('result');

    verifyBtn.addEventListener('click', async () => {
      const code = codeInput.value.trim().toUpperCase();
      if (!code.startsWith("MEDC") || code.length !== 10) {
        resultBox.style.display = 'block';
        resultBox.className = 'result invalid';
        resultBox.innerHTML = '<strong>❌ Invalid format.</strong><br>Please enter a valid MEDC code (e.g. MEDC123456).';
        return;
      }

      resultBox.style.display = 'block';
      resultBox.className = 'result';
      resultBox.innerHTML = '⏳ Verifying... Please wait.';

      try {
        const response = await fetch(`/api/verify/${code}`);
        if (!response.ok) throw new Error('Invalid or unrecognized code.');

        const data = await response.json();

        if (data.valid) {
          const r = data.record;
          resultBox.className = 'result valid';
          resultBox.innerHTML = `
            <strong>✅ Verified Certificate</strong><br><br>
            <strong>Certificate ID:</strong> ${r.medcCode}<br>
            <strong>Name:</strong> ${r.firstName} ${r.lastName}<br>
            <strong>Certificate Type:</strong> ${r.certType}<br>
            <strong>Reason:</strong> ${r.reason}<br>
            <strong>Leave Dates:</strong> ${r.fromDate} → ${r.toDate}<br>
            <strong>Issued:</strong> ${new Date(r.timestamp).toLocaleString()}<br><br>
            <em>This certificate was issued by an AHPRA-registered medical practitioner and verified via VividMedi’s secure system.</em>
          `;
        } else {
          resultBox.className = 'result invalid';
          resultBox.innerHTML = '<strong>❌ Certificate not found.</strong><br>This MEDC number could not be verified.';
        }
      } catch (err) {
        resultBox.className = 'result invalid';
        resultBox.innerHTML = `<strong>❌ Error:</strong> ${err.message}`;
      }
    });

    codeInput.addEventListener('keypress', e => {
      if (e.key === 'Enter') verifyBtn.click();
    });
  </script>
</body>
</html>
