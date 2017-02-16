import string
import random



def gen_rand_string(n):

	out = ""
	while True:
		c = random.choice(string.lowercase)

		if out.find(c) == -1:
			out += c
			if len(out) >= n:
				return out



#cases 1-100
for i in range(100):
	print gen_rand_string(3)

#cases 101-120
for i in range(20):
	print gen_rand_string(4)

#cases 121-130
for i in range(10):
	print gen_rand_string(5)

#cases 131-133
for i in range(3):
	print gen_rand_string(6)

#cases 134
print gen_rand_string(7)

