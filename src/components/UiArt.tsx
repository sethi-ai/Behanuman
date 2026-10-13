/* eslint-disable @next/next/no-img-element */
export default function UiArt({ name, theme, className="ui-art" }: { name:string;theme:string;className?:string }) {
 return <img className={className} alt="" src={`/images/ui/${theme==="light"?"":"dark/"}${name}.webp`}/>;
}
