import React, { useRef, useState } from 'react';
import HTMLFlipBook from 'react-pageflip';

const Page = React.forwardRef((props, ref) => {
    return (
        <div className="demoPage bg-white shadow-[0_0_15px_rgba(0,0,0,0.1)] overflow-hidden relative border border-slate-200 flex flex-col" ref={ref} style={{ padding: '0', backgroundColor: '#fff' }}>
            {/* Watermark / Background */}
            <div className="absolute inset-0 z-0 opacity-[0.08] flex items-center justify-center pointer-events-none">
                 {props.bgImage && <img src={props.bgImage} alt="watermark" className="w-[80%] h-auto object-contain" />}
            </div>
            
            {/* Content */}
            <div className="relative z-10 w-full h-full flex flex-col p-8">
                {props.children}
            </div>
            
            {/* Page number */}
            <div className="absolute bottom-4 left-0 right-0 text-center text-xs text-slate-400 font-medium z-10">
                - {props.number} -
            </div>
            
            {/* Book Spine Shadow Effect */}
            <div className={`absolute top-0 bottom-0 w-8 z-20 pointer-events-none ${props.isLeft ? 'right-0 bg-gradient-to-l from-black/10 to-transparent' : 'left-0 bg-gradient-to-r from-black/10 to-transparent'}`}></div>
        </div>
    );
});

export default function FlipbookViewer({ title, pages, onClose, bgImage }) {
    const book = useRef();
    const [page, setPage] = useState(0);

    const nextButtonClick = () => {
        book.current.pageFlip().flipNext();
    };

    const prevButtonClick = () => {
        book.current.pageFlip().flipPrev();
    };

    return (
        <div className="fixed inset-0 z-[100] bg-slate-900/95 backdrop-blur-md flex flex-col items-center justify-center transition-all duration-500">
            {/* Header / Toolbar */}
            <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center text-white z-50 bg-gradient-to-b from-black/50 to-transparent">
                <div className="flex flex-col">
                    <h2 className="text-2xl font-black tracking-widest uppercase text-white drop-shadow-md">{title}</h2>
                    <p className="text-sky-300 text-xs font-bold tracking-widest uppercase mt-1">Mode Buku Digital</p>
                </div>
                <button onClick={onClose} className="p-3 bg-white/10 hover:bg-rose-500/80 rounded-full transition-all duration-300 backdrop-blur-md hover:rotate-90 group" title="Tutup Flipbook">
                    <svg className="w-6 h-6 text-white group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
            </div>
            
            {/* Flipbook Container */}
            <div className="flex-1 flex items-center justify-center w-full relative px-2 sm:px-12">
                
                {/* Prev Button */}
                <button onClick={prevButtonClick} className="hidden sm:block absolute left-2 md:left-8 z-50 p-3 md:p-4 bg-white/5 hover:bg-sky-500 rounded-full text-white backdrop-blur-md transition-all duration-300 border border-white/10 hover:shadow-[0_0_20px_rgba(14,165,233,0.5)] group" title="Halaman Sebelumnya">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5 md:w-6 md:h-6 group-hover:-translate-x-1 transition-transform">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
                    </svg>
                </button>

                <div className="shadow-2xl">
                    <HTMLFlipBook 
                        width={550} 
                        height={750} 
                        size="stretch"
                        minWidth={400}
                        maxWidth={750}
                        minHeight={550}
                        maxHeight={950}
                        maxShadowOpacity={0.6}
                        showCover={true}
                        mobileScrollSupport={true}
                        usePortrait={true}
                        onFlip={(e) => setPage(e.data)}
                        className="mx-auto"
                        ref={book}
                    >
                        {/* COVER PAGE */}
                        <Page number={1} bgImage={bgImage} isLeft={false}>
                            <div className="flex-1 flex flex-col items-center justify-center text-center h-full">
                               <h1 className="text-4xl font-black text-slate-800 uppercase leading-tight mb-6 px-4">{title}</h1>
                               <div className="w-20 h-1.5 bg-sky-500 mx-auto mb-8 rounded-full"></div>
                               <p className="text-slate-600 font-bold tracking-widest uppercase text-sm">Kementerian Luar Negeri</p>
                               <p className="text-slate-400 font-medium text-xs mt-2 tracking-widest">Republik Indonesia</p>
                            </div>
                        </Page>

                        {/* DATA PAGES */}
                        {pages.map((pageData, index) => (
                            <Page key={index} number={index + 2} bgImage={bgImage} isLeft={(index + 2) % 2 === 0}>
                                <div className="flex-grow flex flex-col font-serif select-none h-full">
                                    {/* 1. Header Halaman */}
                                    <h4 className="text-center font-bold text-slate-500 text-[10px] tracking-wider uppercase mb-1">
                                        {pageData.type === 'dalam' ? 'DAFTAR PEJABAT DALAM NEGERI' : 'DAFTAR PEJABAT LUAR NEGERI'}
                                    </h4>
                                    
                                    {/* 2. Nama Satuan Kerja */}
                                    <h3 className="text-center font-bold text-slate-900 text-xs uppercase mb-2 max-w-[90%] mx-auto leading-tight">
                                        {pageData.unitName}
                                    </h3>
                                    
                                    {/* 3. Double Border Divider */}
                                    <div className="border-b-[3px] border-double border-slate-400 mb-3 pb-0.5"></div>
                                    
                                    {/* 4. Profile block (only on first page of unit) */}
                                    {!pageData.isLanjutan && (
                                        <div className="grid grid-cols-[100px_10px_1fr] text-[10px] gap-y-0.5 text-slate-800 leading-normal mb-4 px-1">
                                            <span className="font-bold">Alamat</span>
                                            <span>:</span>
                                            <span>{pageData.unit.alamat || "-"}</span>

                                            <span className="font-bold">No. Telepon</span>
                                            <span>:</span>
                                            <span>{pageData.unit.telepon || "-"}</span>

                                            <span className="font-bold">Fax</span>
                                            <span>:</span>
                                            <span>{pageData.unit.fax || "-"}</span>

                                            <span className="font-bold">Email</span>
                                            <span>:</span>
                                            <span>{pageData.unit.email || "-"}</span>

                                            <span className="font-bold">Website</span>
                                            <span>:</span>
                                            <span>{pageData.unit.website || "-"}</span>

                                            {pageData.type === 'luar' && (
                                                <>
                                                    <span className="font-bold">Hari Kerja</span>
                                                    <span>:</span>
                                                    <span>{pageData.unit.hari_kerja || "-"}</span>

                                                    <span className="font-bold">Beda Jam</span>
                                                    <span>:</span>
                                                    <span>{pageData.unit.beda_jam || "-"}</span>

                                                    <span className="font-bold">Musim Panas</span>
                                                    <span>:</span>
                                                    <span>{pageData.unit.musim_panas || "-"}</span>

                                                    <span className="font-bold">Musim Dingin</span>
                                                    <span>:</span>
                                                    <span>{pageData.unit.musim_dingin || "-"}</span>
                                                </>
                                            )}
                                        </div>
                                    )}
                                    
                                    {/* 5. Pejabat Table */}
                                    <div className="flex-grow min-h-0 overflow-hidden">
                                        <table className="w-full text-left text-[9px] border-collapse">
                                            <thead>
                                                <tr className="border-t border-b border-black text-slate-800 font-bold bg-slate-50/50">
                                                    <th className="py-1.5 text-center w-8">No.</th>
                                                    <th className="py-1.5 text-left w-[110px]">Nama Lengkap</th>
                                                    <th className="py-1.5 text-left w-[110px]">Jabatan</th>
                                                    <th colSpan="3" className="py-1.5 text-center">Alamat & Telepon</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 text-slate-700">
                                                {pageData.pejabat.length === 0 ? (
                                                    <tr>
                                                        <td className="py-2 text-center align-top border-b border-black">1.</td>
                                                        <td colSpan="5" className="py-8 text-center italic text-slate-400 font-medium align-middle border-b border-black">
                                                            Data Pejabat Belum Tersedia
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    pageData.pejabat.map((p, pIdx) => {
                                                        const span = p.contacts.length;
                                                        return p.contacts.map((c, cIdx) => {
                                                            const isLastRowOfUnit = pIdx === pageData.pejabat.length - 1 && cIdx === span - 1;
                                                            const borderClass = isLastRowOfUnit ? "border-b border-black" : "";
                                                            
                                                            if (cIdx === 0) {
                                                                return (
                                                                    <tr key={`${pIdx}-${cIdx}`} className={`hover:bg-slate-50/30 transition-colors ${borderClass}`}>
                                                                        <td rowSpan={span} className="py-1.5 text-center align-top border-r border-slate-100">{pageData.startIndex + pIdx + 1}.</td>
                                                                        <td rowSpan={span} className="py-1.5 align-top font-bold pr-2 leading-tight border-r border-slate-100">{p.nama}</td>
                                                                        <td rowSpan={span} className="py-1.5 align-top leading-tight pr-2 border-r border-slate-100">{p.jabatan}</td>
                                                                        <td className="py-1.5 align-top pl-2 font-semibold w-12 text-slate-600">{c.lbl}</td>
                                                                        <td className="py-1.5 align-top text-center w-3 text-slate-400">:</td>
                                                                        <td className="py-1.5 align-top leading-tight text-slate-700 pl-1">{c.val}</td>
                                                                    </tr>
                                                                );
                                                            } else {
                                                                return (
                                                                    <tr key={`${pIdx}-${cIdx}`} className={`hover:bg-slate-50/30 transition-colors ${borderClass}`}>
                                                                        <td className="py-1 align-top pl-2 font-semibold text-slate-600 border-l border-slate-100">{c.lbl}</td>
                                                                        <td className="py-1 align-top text-center text-slate-400">:</td>
                                                                        <td className="py-1 align-top leading-tight text-slate-700 pl-1">{c.val}</td>
                                                                    </tr>
                                                                );
                                                            }
                                                        });
                                                    })
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </Page>
                        ))}

                        {/* BACK COVER */}
                        <Page number={pages.length + 2} bgImage={bgImage} isLeft={(pages.length + 2) % 2 === 0}>
                            <div className="flex-1 flex flex-col items-center justify-center text-center h-full">
                               <h1 className="text-xl font-bold text-slate-400 uppercase leading-tight mb-4 tracking-widest">Akhir Dokumen</h1>
                               <div className="w-12 h-1 bg-slate-200 mx-auto mb-6 rounded-full"></div>
                               <p className="text-slate-400 font-medium text-[10px] uppercase tracking-widest">Buku Pejabat Kemenlu RI</p>
                            </div>
                        </Page>
                    </HTMLFlipBook>
                </div>

                {/* Next Button */}
                <button onClick={nextButtonClick} className="hidden sm:block absolute right-2 md:right-8 z-50 p-3 md:p-4 bg-white/5 hover:bg-sky-500 rounded-full text-white backdrop-blur-md transition-all duration-300 border border-white/10 hover:shadow-[0_0_20px_rgba(14,165,233,0.5)] group" title="Halaman Selanjutnya">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5 md:w-6 md:h-6 group-hover:translate-x-1 transition-transform">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                    </svg>
                </button>
            </div>
            
            {/* Footer / Controls */}
            <div className="absolute bottom-6 bg-black/40 backdrop-blur-md px-6 py-2 rounded-full border border-white/10 text-white font-medium text-sm flex items-center gap-4">
                 <span className="uppercase tracking-wider text-xs text-slate-300">Halaman</span>
                 <span className="bg-sky-500/80 px-3 py-1 rounded-md shadow-inner">{page === 0 ? 1 : page} / {pages.length + 2}</span>
            </div>
        </div>
    );
}
