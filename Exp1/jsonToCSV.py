import io
import json
import csv
from os import listdir
from os.path import isfile, join
mypath = 'data/json/' #set path to folder containing json files

files = [f for f in listdir(mypath) if isfile(join(mypath, f))]
raw = open('data/raw.csv','w')
csvwriter = csv.writer(raw)
head = 0
for f in files[1:len(files)]: #iterate through files in folder
	with io.open('data/json/'+f,'r',encoding='utf-8',errors='ignore') as f:
	 	content = f.read()
	 	parsed = json.loads(content)
	 	subjID = parsed['client'].get('sid') #get participant ID
		subjData = parsed['trials'] #get participant data
		
		for s in subjData:
			vals = [subjID] #init data array
			if(head==0): #header only included in first row of csv
				header = ['subjID'] #init header array
				header.extend(s.keys())
				csvwriter.writerow(header)
				head = 1
			vals.extend(s.values())
			csvwriter.writerow(vals)
raw.close()

