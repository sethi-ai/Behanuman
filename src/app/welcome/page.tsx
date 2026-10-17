import type {Metadata} from 'next';
import ConceptLanding from '@/components/ConceptLanding';
import './concept.css';
export const metadata:Metadata={title:'Be Hanuman. Find it within.',description:'Make room for devotion, courage and steadiness through daily chanting, learning and reflection.'};
export default function WelcomePage(){return <ConceptLanding/>;}
