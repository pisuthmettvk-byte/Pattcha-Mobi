// 🚀 ระบบ Login แบบใหม่ (ใช้ fetch คุยกับ API แทน google.script.run)
    async function submitLogin() {
      const code = document.getElementById('branchCodeInput').value.trim().toUpperCase();
      const btn = document.getElementById('btnSubmitLogin');
      if(!code) return alert("⚠️ กรุณากรอกรหัสสาขาครับ");
      btn.innerText = "⏳ LOADING...";
      btn.disabled = true;

      try {
        // ยิง API ไปขอดึงข้อมูล
        const response = await fetch(API_URL + "?action=login&branch=" + code);
        const res = await response.json();

        if(res.success) {
          localStorage.setItem('pattcha_branch', code);
          localProductDatabase = res.products;
          currentBranch = res.branch;
          document.getElementById('loginView').classList.add('hide');
          document.getElementById('mainMenuView').classList.remove('hide');
          document.getElementById('branchLabel').innerText = "LOCATION : " + currentBranch;
        } else {
          alert("❌ " + res.message);
        }
      } catch (err) {
        alert("❌ ระบบขัดข้อง: ไม่สามารถเชื่อมต่อกับฐานข้อมูลได้");
      }
      btn.innerText = "SUBMIT";
      btn.disabled = false;
    }

 // --- เรนเดอร์ข้อมูล ---
    function renderCategories() {
      currentStockView = 'category';
      document.getElementById('stockHeaderTitle').innerText = "STOCK IN HOUSE"; 
      document.getElementById('categoryListContainer').classList.remove('hide');
      document.getElementById('productListContainer').classList.add('hide');
      
      const container = document.getElementById('categoryListContainer');
      container.innerHTML = "";
      const categoriesMap = new Map();
      localProductDatabase.forEach(item => {
        const catName = item.category || "Uncategorized";
        if(!categoriesMap.has(catName)) categoriesMap.set(catName, catName);
      });

      Array.from(categoriesMap.values()).sort().forEach(cat => {
        const div = document.createElement('div');
        div.className = 'category-row';
        div.innerHTML = `<div class="cat-icon-box"><i class="fas ${getCategoryIcon(cat)}"></i></div><span style="flex-grow: 1;">${cat}</span>`;
        div.onclick = () => filterByCategory(cat);
        container.appendChild(div);
      });
    }

function renderProducts(products) {
      const container = document.getElementById('productListContainer');
      container.innerHTML = "";
      products.forEach(item => {
        const div = document.createElement('div');
        div.className = 'product-row';
        div.onclick = () => openProductDetail(item.sku);
        div.innerHTML = `<img class="prod-img" src="${parseDriveImage(item.imageUrl)}"><div class="prod-info-wrapper"><div class="prod-text"><div class="prod-sku">${item.sku}</div><div class="prod-name">${item.name}</div></div><div class="prod-numbers"><div class="prod-price">฿${Number(item.price).toLocaleString()}</div><div class="prod-stats-row"><span style="color: #10b981;">${item.availableStock}</span></div></div></div>`;
        container.appendChild(div);
      });
    }


// --- ระบบแปลงรูปภาพ ---
    function parseDriveImage(url) {
      if (!url || url === 'CellImage') return 'https://upload.wikimedia.org/wikipedia/commons/1/14/No_Image_Available.jpg';
      let match = url.match(/id=([a-zA-Z0-9_-]+)/) || url.match(/d\/([a-zA-Z0-9_-]+)/);
      if (match && match[1]) return 'https://drive.google.com/thumbnail?id=' + match[1] + '&sz=w500';
      return url;
    }
