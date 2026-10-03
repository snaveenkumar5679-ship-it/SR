const KEY='srLibraryData', THEME='srTheme';
let data;
try{data=JSON.parse(localStorage.getItem(KEY))}catch(e){}
data=data||{books:[],students:[],issues:[]};
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const iso=d=>d.toISOString().slice(0,10);
const today=()=>iso(new Date());
const ISO=/^\d{4}-\d{2}-\d{2}$/;
const fmt=d=>!d?'—':ISO.test(d)?new Date(d+'T00:00').toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}):d;
const overdue=x=>x.status==='Issued'&&x.dueDate&&x.dueDate<today();
const state=x=>overdue(x)?'Overdue':x.status;
const pill=s=>`<span class="pill ${{Available:'ok',Issued:'info',Overdue:'bad',Returned:'mute'}[s]}">${s==='Issued'?'On loan':s}</span>`;
const initials=n=>n.split(/\s+/).slice(0,2).map(w=>w[0]).join('').toUpperCase();
let filter='all',tt;

function toast(msg){const t=$('toast');t.textContent=msg;t.classList.add('show');clearTimeout(tt);tt=setTimeout(()=>t.classList.remove('show'),2400)}
function save(){try{localStorage.setItem(KEY,JSON.stringify(data))}catch(e){toast('Could not save. Browser storage may be full or blocked.')}render()}

function render(){
  const active=data.issues.filter(x=>x.status==='Issued'),out=new Set(active.map(x=>x.bookId));
  const late=active.filter(overdue).length;
  $('totalBooks').textContent=data.books.length;
  $('availableBooks').textContent=data.books.filter(b=>!out.has(b.id)).length;
  $('issuedBooks').textContent=active.length;
  $('overdueBooks').textContent=late;$('overdueBooks').classList.toggle('has',late>0);
  $('totalStudents').textContent=data.students.length;

  const bq=$('bookSearch').value.toLowerCase();
  $('booksTable').innerHTML=data.books.filter(b=>`${b.title} ${b.author} ${b.id}`.toLowerCase().includes(bq)).map(b=>`<tr><td>${esc(b.id)}</td><td><strong>${esc(b.title)}</strong></td><td>${esc(b.author)}</td><td>${pill(out.has(b.id)?'Issued':'Available')}</td><td><button class="action del" data-act="delBook" data-id="${esc(b.id)}">Delete</button></td></tr>`).join('')
    ||`<tr><td colspan="5" class="empty">${bq?'No books match your search.':'No books yet. Add your first title above.'}</td></tr>`;

  const sq=$('studentSearch').value.toLowerCase();
  $('studentsTable').innerHTML=data.students.filter(s=>`${s.name} ${s.id} ${s.department}`.toLowerCase().includes(sq)).map(s=>`<tr><td><div class="who"><span class="avatar">${esc(initials(s.name))}</span>${esc(s.name)}</div></td><td>${esc(s.id)}</td><td>${esc(s.department)}</td><td>${active.filter(x=>x.studentId===s.id).length}</td><td><button class="action del" data-act="delStudent" data-id="${esc(s.id)}">Delete</button></td></tr>`).join('')
    ||`<tr><td colspan="5" class="empty">${sq?'No students match your search.':'No students yet. Register one above.'}</td></tr>`;

  $('issueBook').innerHTML='<option value="">Select available book</option>'+data.books.filter(b=>!out.has(b.id)).map(b=>`<option value="${esc(b.id)}">${esc(b.id)} — ${esc(b.title)}</option>`).join('');
  $('issueStudent').innerHTML='<option value="">Select student</option>'+data.students.map(s=>`<option value="${esc(s.id)}">${esc(s.id)} — ${esc(s.name)}</option>`).join('');

  const rows=[...data.issues].reverse().filter(x=>filter==='all'||state(x)===filter);
  $('issueTable').innerHTML=rows.map(x=>{const b=data.books.find(b=>b.id===x.bookId),s=data.students.find(s=>s.id===x.studentId);
    return `<tr><td>${esc(b?.title||x.bookId)}</td><td>${esc(s?.name||x.studentId)}</td><td>${esc(fmt(x.issueDate))}</td><td>${esc(fmt(x.dueDate))}</td><td>${pill(state(x))}</td><td>${x.status==='Issued'?`<button class="action return" data-act="return" data-id="${esc(x.id)}">Mark returned</button>`:esc(fmt(x.returnDate))}</td></tr>`}).join('')
    ||`<tr><td colspan="6" class="empty">${data.issues.length?'No loans in this view.':'No loans yet. Issue a book to get started.'}</td></tr>`;

  $('recordSummary').innerHTML=[['Books',data.books.length],['Students',data.students.length],['Loans recorded',data.issues.length],['Returned',data.issues.filter(x=>x.status==='Returned').length]].map(x=>`<div class="record-card"><span>${x[0]}</span><strong>${x[1]}</strong></div>`).join('');
  $('activity').innerHTML=[...data.issues].reverse().slice(0,6).map(x=>{const b=data.books.find(b=>b.id===x.bookId),s=data.students.find(s=>s.id===x.studentId);
    return `<li><span>${esc(b?.title||x.bookId)} ${x.status==='Returned'?'returned by':'issued to'} ${esc(s?.name||x.studentId)}</span><small>${esc(fmt(x.status==='Returned'?x.returnDate:x.issueDate))}</small></li>`}).join('')
    ||'<li class="empty" style="display:block">Activity will appear here once books are issued.</li>';
}

$('bookForm').addEventListener('submit',e=>{e.preventDefault();const id=$('bookId').value.trim();
  if(data.books.some(b=>b.id.toLowerCase()===id.toLowerCase()))return toast('That book ID is already in use.');
  data.books.push({id,title:$('bookTitle').value.trim(),author:$('bookAuthor').value.trim()});e.target.reset();save();toast('Book added.')});
$('studentForm').addEventListener('submit',e=>{e.preventDefault();const id=$('studentId').value.trim();
  if(data.students.some(s=>s.id.toLowerCase()===id.toLowerCase()))return toast('That student ID is already in use.');
  data.students.push({id,name:$('studentName').value.trim(),department:$('studentDepartment').value.trim()});e.target.reset();save();toast('Student registered.')});
$('issueForm').addEventListener('submit',e=>{e.preventDefault();const bookId=$('issueBook').value,studentId=$('issueStudent').value;
  if(!bookId||!studentId)return toast('Choose both a book and a student.');
  const due=new Date();due.setDate(due.getDate()+ +$('issueDays').value);
  data.issues.push({id:crypto.randomUUID(),bookId,studentId,issueDate:today(),dueDate:iso(due),status:'Issued'});save();toast('Book issued.')});
['bookSearch','studentSearch'].forEach(id=>$(id).addEventListener('input',render));

$('issueFilters').addEventListener('click',e=>{const c=e.target.closest('.chip');if(!c)return;filter=c.dataset.f;
  document.querySelectorAll('.chip').forEach(x=>x.classList.toggle('active',x===c));render()});

document.addEventListener('click',e=>{const b=e.target.closest('[data-act]');if(!b)return;const id=b.dataset.id;
  if(b.dataset.act==='delBook'){if(data.issues.some(x=>x.bookId===id&&x.status==='Issued'))return toast('Return this book before deleting it.');
    data.books=data.books.filter(x=>x.id!==id);save();toast('Book deleted.')}
  if(b.dataset.act==='delStudent'){if(data.issues.some(x=>x.studentId===id&&x.status==='Issued'))return toast('This student still holds a book. Return it first.');
    data.students=data.students.filter(x=>x.id!==id);save();toast('Student deleted.')}
  if(b.dataset.act==='return'){const x=data.issues.find(x=>x.id===id);if(x){x.status='Returned';x.returnDate=today();save();toast('Book returned.')}}});

document.querySelectorAll('.tab').forEach(btn=>btn.addEventListener('click',()=>{
  document.querySelectorAll('.tab').forEach(x=>x.classList.toggle('active',x===btn));
  document.querySelectorAll('.panel').forEach(x=>x.classList.toggle('active',x.id===btn.dataset.tab))}));

$('exportCsv').addEventListener('click',()=>{
  if(!data.issues.length)return toast('No loans to export yet.');
  const q=v=>`"${String(v??'').replace(/"/g,'""')}"`;
  const lines=[['Book','Student','Issued','Due','Status','Returned'].join(',')].concat(data.issues.map(x=>{
    const b=data.books.find(b=>b.id===x.bookId),s=data.students.find(s=>s.id===x.studentId);
    return [b?.title||x.bookId,s?.name||x.studentId,fmt(x.issueDate),fmt(x.dueDate),state(x),fmt(x.returnDate)].map(q).join(',')}));
  const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([lines.join('\n')],{type:'text/csv'}));a.download='library-loans.csv';a.click();URL.revokeObjectURL(a.href);toast('Loans exported.')});

$('resetData').addEventListener('click',()=>{if(confirm('Delete all books, students and loans? This cannot be undone.')){data={books:[],students:[],issues:[]};save();toast('All data deleted.')}});

function setTheme(t){document.documentElement.dataset.theme=t;$('themeToggle').textContent=t==='dark'?'Light mode':'Dark mode';try{localStorage.setItem(THEME,t)}catch(e){}}
$('themeToggle').addEventListener('click',()=>setTheme(document.documentElement.dataset.theme==='dark'?'light':'dark'));
let saved=null;try{saved=localStorage.getItem(THEME)}catch(e){}
setTheme(saved||(matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light'));
render();
