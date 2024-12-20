import tensorflow as tf
import os
import sys
from dataParse import get_tempo_and_time_signature
from dataParse import getMessages
from dataParse import getMessagesOrig
from dataParse import getMessagesCutOutNoise

from basic_pitch.inference import predict, Model
from basic_pitch import ICASSP_2022_MODEL_PATH

basic_pitch_model = Model(ICASSP_2022_MODEL_PATH)

from basic_pitch.inference import predict_and_save


#this just runs once in the beginning
def prediction(id, bpm_value):
    wav_name = f'{id}_rec.wav'

    predict_and_save(
        audio_path_list=[wav_name],
        output_directory=".",
        save_midi=True,
        sonify_midi=True,
        save_model_outputs=False,
        save_notes=False,
        model_or_model_path=basic_pitch_model,
        onset_threshold=0.70,
        frame_threshold=0.50,
        minimum_note_length=11,
        midi_tempo=int(bpm_value),
        multiple_pitch_bends=False
    )

def record_convert_no_offset(id):
    print("Running")
        
        

    #convert data then figure out how you will push delete the midi files.
    #pybind stuff. 
    mid_basic = f'{id}_rec_basic_pitch.mid'
    #mid_basic_wav = f'{id}_rec_basic_pitch.wav'


    tempo, time_signature, ticks_per_beat = get_tempo_and_time_signature(mid_basic)
    print(tempo)
    print(time_signature)
    print(ticks_per_beat)

    notes = getMessagesOrig(mid_basic)
    print(notes)
    print(len(notes))

    #remove
    return notes


def midi_to_note_name(midi_number):
    """
    Convert a MIDI note number to its corresponding note name.
    
    :param midi_number: MIDI note number (integer, 0-127)
    :return: Note name (string) and octave (integer)
    """
    if not (0 <= midi_number <= 127):
        raise ValueError("MIDI number must be between 0 and 127.")
    
    # List of note names
    note_names = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
    
    # Calculate note name and octave
    note_index = midi_number % 12
    octave = (midi_number // 12) - 1  # MIDI starts at octave -1
    note_name = note_names[note_index]
    
    return f"{note_name}{octave}"

def record_convert_offset(id):
    print("Running")
        
        

    #convert data then figure out how you will push delete the midi files.
    #pybind stuff. 
    mid_basic = f'{id}_rec_basic_pitch.mid'
    #mid_basic_wav = f'{id}_rec_basic_pitch.wav'


    tempo, time_signature, ticks_per_beat = get_tempo_and_time_signature(mid_basic)
    print(tempo)
    print(time_signature)
    print(ticks_per_beat)

    notes = getMessagesCutOutNoise(mid_basic)
    print(notes)
    print(len(notes))

    converted_data = [[midi_to_note_name(note[0]), note[1], note[2]] for note in notes]

    # Print the converted list
    print(converted_data)

    #remove
    return notes



def record_convert(id, duration, bpm_value):
    #convert data then figure out how you will push delete the midi files.
    #pybind stuff. 
    mid_basic = f'{id}_rec_basic_pitch.mid'
    #mid_basic_wav = f'{id}_rec_basic_pitch.wav'


    tempo, time_signature, ticks_per_beat = get_tempo_and_time_signature(mid_basic)
    print(tempo)
    print(time_signature)
    print(ticks_per_beat)

    notes = getMessages(mid_basic)
    print(notes)
    print(len(notes))

    return notes


def remove_files(id):
    os.remove(f'{id}_rec_basic_pitch.mid')
    os.remove(f'{id}_rec_basic_pitch.wav')
    os.remove(f'{id}_rec.wav')

