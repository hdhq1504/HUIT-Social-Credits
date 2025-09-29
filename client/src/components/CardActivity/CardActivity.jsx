import React from 'react';

function CardActivity() {
  return (
    <div
      data-property-1="Default label"
      className="w-60 bg-White rounded-[20px] inline-flex flex-col justify-start items-start"
    >
      <div className="self-stretch h-36 relative rounded-tl-[20px] rounded-tr-[20px] rounded-br-[35px]">
        <div className="w-60 h-36 p-2.5 left-0 top-0 absolute" />
        <div className="w-14 h-5 left-[-3px] top-[10px] absolute">
          <div className="w-[3px] h-1 left-0 top-[19px] absolute bg-Text-Orange rounded-bl-xs overflow-hidden">
            <div className="w-[3px] h-1 left-0 top-0 absolute bg-amber-900 rounded-tl-[5px] rounded-bl-[5px]" />
          </div>
          <div className="size- px-1 py-0.5 left-0 top-0 absolute bg-Text-Orange rounded-tl-sm rounded-tr-lg rounded-br-lg shadow-[3px_2px_5px_0px_rgba(0,0,0,0.20)] inline-flex justify-center items-center gap-2.5">
            <div className="text-right justify-center text-Text-White text-xs font-medium font-['Montserrat']">
              Nổi bật
            </div>
          </div>
        </div>
      </div>
      <div className="self-stretch px-3 py-2 rounded-bl-sm rounded-br-sm flex flex-col justify-start items-start gap-2">
        <div className="self-stretch justify-start text-Dark text-sm font-medium font-['Montserrat']">
          Thăm và tặng quà cho các cụ già tại viện dưỡng lão
        </div>
        <div className="w-20 inline-flex justify-start items-center gap-2 flex-wrap content-center">
          <div className="size-3.5 relative">
            <div className="size-3.5 left-0 top-0 absolute bg-Dark" />
          </div>
          <div className="justify-end text-Text-Orange text-xs font-bold font-['Montserrat']">15 điểm</div>
        </div>
        <div className="size- inline-flex justify-start items-center gap-[5px]">
          <div className="size-3.5 relative">
            <div className="w-3 h-3.5 left-0 top-0 absolute">
              <div className="w-3 h-3.5 left-0 top-0 absolute bg-Dark" />
            </div>
          </div>
          <div className="text-center justify-start text-Dark text-xs font-light font-['Montserrat']">
            15/12/2024 - 8:00 AM
          </div>
        </div>
        <div className="size- inline-flex justify-start items-center gap-[5px]">
          <div className="size-3.5 relative overflow-hidden">
            <div className="w-2.5 h-3 left-[2.19px] top-[1.31px] absolute bg-Dark border-[0.58px] border-Dark" />
          </div>
          <div className="text-center justify-start text-Dark text-xs font-light font-['Montserrat']">
            Viện dưỡng lão Thị Nghè
          </div>
        </div>
        <div className="self-stretch inline-flex justify-between items-center">
          <img className="size-8 rounded-full border border-White" src="https://placehold.co/32x32" />
          <img className="size-8 rounded-full border border-White" src="https://placehold.co/32x32" />
          <img className="size-8 rounded-full border border-White" src="https://placehold.co/32x32" />
          <div className="size- flex justify-start items-start gap-2.5">
            <div className="size- flex justify-start items-center gap-1">
              <div className="justify-start text-zinc-400 text-sm font-medium font-['Montserrat']">Số lượng: 12/50</div>
            </div>
          </div>
        </div>
        <div className="self-stretch inline-flex justify-center items-start gap-3">
          <div
            data-priority="White"
            data-state="Active"
            className="w-20 px-3 py-2 bg-Bg-White rounded-lg outline outline-1 outline-offset-[-1px] outline-Dark flex justify-center items-center overflow-hidden"
          >
            <div className="justify-center text-Text-Black text-sm font-normal font-['Montserrat']">Chi tiết</div>
          </div>
          <div
            data-priority="Primary"
            data-state="Active"
            className="w-32 px-3 py-2 bg-Primary rounded-lg flex justify-center items-center overflow-hidden"
          >
            <div className="justify-center text-Text-White text-sm font-normal">Đăng ký ngay</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CardActivity;
