import { Metadata } from 'next';
import CompassClient from './CompassClient';

export const metadata: Metadata = {
    title: 'Political Compass Generator | Syrian Zone',
    description: 'Create your own custom political compass with customizable axes, colors, and dots.',
};

export default function AlignmentPage() {
    return <CompassClient />;
}
