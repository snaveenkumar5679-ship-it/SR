const KEY='srLibraryData';
let data=JSON.parse(localStorage.getItem(KEY)||'null')||{books:[],students:[],issues:[]};
const $=id=>document.getElementById(id);
function save(){localStorage.setItem(KEY,JSON.stringify(data));render();}
function toast(msg){const t=$('toast');t.textContent=msg;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2200)}
function esc(s){return String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
function render(){
  const issuedIds=new Set(data.issues.filter(x=>x.status==='Issued').map(x=>x.bookId));
  $('totalBooks').textContent=data.books.length;$('availableBooks').textContent=data.books.filter(b=>!issuedIds.has(b.id)).length;$('issuedBooks').textContent=data.issues.filter(x=>x.status==='Issued').length;$('totalStudents').textContent=data.students.length;
  const bq=$('bookSearch').value.toLowerCase();
  $('booksTable').innerHTML=data.books.filter(b=>(b.title+' '+b.author+' '+b.id).toLowerCase().includes(bq)).map(b=>`<tr><td>${esc(b.id)}</td><td>${esc(b.title)}</td><td>${esc(b.author)}</td><td>${issuedIds.has(b.id)?'Issued':'Available'}</td><td><button class="action" onclick="deleteBook('${encodeURIComponent(b.id)}')">Delete</button></td></tr>`).join('')||`<tr><td colspan="5" class="empty">No books found.</td></tr>`;
  const sq=$('studentSearch').value.toLowerCase();
  $('studentsTable').innerHTML=data.students.filter(s=>(s.name+' '+s.id+' '+s.department).toLowerCase().includes(sq)).map(s=>`<tr><td>${esc(s.id)}</td><td>${esc(s.name)}</td><td>${esc(s.department)}</td><td><button class="action" onclick="deleteStudent('${encodeURIComponent(s.id)}')">Delete</button></td></tr>`).join('')||`<tr><td colspan="4" class="empty">No students found.</td></tr>`;
  $('issueBook').innerHTML='<option value="">Select available book</option>'+data.books.filter(b=>!issuedIds.has(b.id)).map(b=>`<option value="${esc(b.id)}">${esc(b.id)} — ${esc(b.title)}</option>`).join('');
  $('issueStudent').innerHTML='<option value="">Select student</option>'+data.students.map(s=>`<option value="${esc(s.id)}">${esc(s.id)} — ${esc(s.name)}</option>`).join('');
  $('issueTable').innerHTML=data.issues.map(x=>{const b=data.books.find(b=>b.id===x.bookId),s=data.students.find(s=>s.id===x.studentId);return `<tr><td>${esc(b?.title||x.bookId)}</td><td>${esc(s?.name||x.studentId)}</td><td>${esc(x.issueDate)}</td><td>${x.status}</td><td>${x.status==='Issued'?`<button class="action return" onclick="returnBook('${x.id}')">Return</button>`:'Returned'}</td></tr>`}).join('')||`<tr><td colspan="5" class="empty">No issue/return records.</td></tr>`;
  $('emptyRecords').style.display=data.books.length||data.students.length||data.issues.length?'none':'block';
  $('recordSummary').innerHTML=[['Books',data.books.length],['Students',data.students.length],['Transactions',data.issues.length]].map(x=>`<div class="record-card"><span>${x[0]}</span><strong>${x[1]}</strong></div>`).join('');
}
$('bookForm').addEventListener('submit',e=>{e.preventDefault();const id=$('bookId').value.trim();if(data.books.some(b=>b.id===id))return toast('Book ID already exists.');data.books.push({id,title:$('bookTitle').value.trim(),author:$('bookAuthor').value.trim()});e.target.reset();save();toast('Book added successfully.');});
$('studentForm').addEventListener('submit',e=>{e.preventDefault();const id=$('studentId').value.trim();if(data.students.some(s=>s.id===id))return toast('Student ID already exists.');data.students.push({id,name:$('studentName').value.trim(),department:$('studentDepartment').value.trim()});e.target.reset();save();toast('Student registered successfully.');});
$('issueForm').addEventListener('submit',e=>{e.preventDefault();const bookId=$('issueBook').value,studentId=$('issueStudent').value;if(!bookId||!studentId)return toast('Select both book and student.');data.issues.push({id:crypto.randomUUID(),bookId,studentId,issueDate:new Date().toLocaleDateString('en-IN'),status:'Issued'});save();toast('Book issued successfully.');});
$('bookSearch').addEventListener('input',render);$('studentSearch').addEventListener('input',render);
$('resetData').addEventListener('click',()=>{if(confirm('Delete all library data?')){data={books:[],students:[],issues:[]};save();toast('All data reset.')}});
document.querySelectorAll('.tab').forEach(btn=>btn.addEventListener('click',()=>{document.querySelectorAll('.tab').forEach(x=>x.classList.remove('active'));document.querySelectorAll('.panel').forEach(x=>x.classList.remove('active'));btn.classList.add('active');$(btn.dataset.tab).classList.add('active')}));
window.deleteBook=id=>{id=decodeURIComponent(id);if(data.issues.some(x=>x.bookId===id&&x.status==='Issued'))return toast('Return the book before deleting it.');data.books=data.books.filter(b=>b.id!==id);save();toast('Book deleted.')};
window.deleteStudent=id=>{id=decodeURIComponent(id);if(data.issues.some(x=>x.studentId===id&&x.status==='Issued'))return toast('Student has an issued book. Return it first.');data.students=data.students.filter(s=>s.id!==id);save();toast('Student deleted.')};
window.returnBook=id=>{const x=data.issues.find(x=>x.id===id);if(x){x.status='Returned';x.returnDate=new Date().toLocaleDateString('en-IN');save();toast('Book returned successfully.')}};
render();
