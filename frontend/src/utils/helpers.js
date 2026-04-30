export const fmt = (n) => new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(n??0);
export const pct = (part,whole) => whole===0?0:Math.min(Math.round(part/whole*100),999);
export const shortDate = (d) => new Date(d).toLocaleDateString('en-US',{month:'short',day:'numeric'});
export const monthKey = (d=new Date()) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
export const monthLabel = (d=new Date()) => d.toLocaleDateString('en-US',{month:'long',year:'numeric'});
export const COLORS = ['#3384f5','#34d399','#f87171','#fbbf24','#a78bfa','#f472b6','#60a5fa','#fb923c','#818cf8','#94a3b8'];
