import { MutableRef } from 'preact/hooks';
import { SoundManager } from '../../../components/soundManager/soundManager';

export const SoundStudio = ({
    refs,
}: {
    refs: {
        ambience: MutableRef<any>;
        click: MutableRef<any>;
        roll: MutableRef<any>;
        win: MutableRef<any>;
        lost: MutableRef<any>;
    };
}) => {
    return (
        <>
            <SoundManager
                ref={refs.ambience}
                src="audio/ambience.wav"
                loop
                volume={0.2}
                playing
            />
            <SoundManager
                ref={refs.click}
                src="audio/click.wav"
                volume={0.1}
                playing
            />
            <SoundManager
                ref={refs.roll}
                src="audio/rollete.wav"
                volume={0.1}
                playing
            />
            <SoundManager
                ref={refs.win}
                src="audio/win.wav"
                volume={0.1}
                playing
            />
            <SoundManager
                ref={refs.lost}
                src="audio/lost.wav"
                volume={0.1}
                playing
            />
        </>
    );
};
